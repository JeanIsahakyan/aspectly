using System.Text.Json;
using System.Text.Json.Serialization;
using Aspectly.Bridge.Protocol;

namespace Aspectly.Bridge;

/// <summary>
/// BridgeHost manages bidirectional communication between .NET and JavaScript
/// via the Aspectly protocol. It handles message passing in both directions
/// and provides type-safe handler registration.
/// </summary>
public class BridgeHost : IDisposable
{
    private readonly IBrowserBridge _browserBridge;
    private readonly IBridgeLogger _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    private bool _initialized;
    private bool _disposed;
    private int _requestIdCounter;

    private readonly List<string> _supportedMethods = new();
    private readonly Dictionary<string, Func<JsonElement, Task<object?>>> _handlers = new();
    private readonly Dictionary<string, TaskCompletionSource<JsonElement>> _pendingRequests = new();
    private readonly object _lock = new();

    /// <summary>
    /// Gets whether the bridge has been initialized (handshake complete).
    /// </summary>
    public bool IsInitialized => _initialized;

    /// <summary>
    /// Gets the list of methods supported by the JavaScript side.
    /// </summary>
    public IReadOnlyList<string> SupportedMethods
    {
        get { lock (_lock) return _supportedMethods.ToList().AsReadOnly(); }
    }

    /// <summary>
    /// Gets the list of registered handler method names.
    /// </summary>
    public IReadOnlyList<string> RegisteredMethods
    {
        get { lock (_lock) return _handlers.Keys.ToList().AsReadOnly(); }
    }

    /// <summary>
    /// Raised when the bridge is initialized (handshake complete).
    /// </summary>
    public event EventHandler? Initialized;

    /// <summary>
    /// Creates a new BridgeHost with the specified browser bridge.
    /// </summary>
    /// <param name="browserBridge">The browser bridge implementation.</param>
    /// <param name="logger">Optional logger. If null, logging is disabled.</param>
    public BridgeHost(IBrowserBridge browserBridge, IBridgeLogger? logger = null)
    {
        _browserBridge = browserBridge ?? throw new ArgumentNullException(nameof(browserBridge));
        _logger = logger ?? NullLogger.Instance;

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new JsonStringEnumConverter() }
        };

        _browserBridge.MessageReceived += OnMessageReceived;
        _logger.Info("[BridgeHost] Created and subscribed to messages");
    }

    private async void OnMessageReceived(object? sender, BrowserMessageEventArgs e)
    {
        try
        {
            await ProcessMessageAsync(e.Message);
        }
        catch (Exception ex)
        {
            _logger.Error("[BridgeHost] Error processing message", ex);
        }
    }

    /// <summary>
    /// Processes a message received from JavaScript.
    /// </summary>
    /// <param name="messageJson">JSON string containing a BridgeEventWrapper.</param>
    public async Task ProcessMessageAsync(string messageJson)
    {
        if (string.IsNullOrEmpty(messageJson)) return;

        try
        {
            _logger.Debug($"[BridgeHost] Received: {messageJson}");

            var wrapper = JsonSerializer.Deserialize<BridgeEventWrapper>(messageJson, _jsonOptions);
            if (wrapper == null || wrapper.Type != "BridgeEvent")
            {
                _logger.Debug("[BridgeHost] Ignoring non-BridgeEvent message");
                return;
            }

            var payload = JsonSerializer.Deserialize<BridgeEventPayload>(wrapper.Event.GetRawText(), _jsonOptions);
            if (payload == null) return;

            await HandleEventAsync(payload);
        }
        catch (JsonException ex)
        {
            _logger.Error("[BridgeHost] JSON parse error", ex);
        }
        catch (Exception ex)
        {
            _logger.Error("[BridgeHost] Error processing message", ex);
        }
    }

    private async Task HandleEventAsync(BridgeEventPayload payload)
    {
        switch (payload.Type)
        {
            case BridgeEventType.Init:
                await HandleInitAsync(payload.Data);
                break;
            case BridgeEventType.Request:
                await HandleRequestAsync(payload.Data);
                break;
            case BridgeEventType.Result:
                HandleResult(payload.Data);
                break;
            case BridgeEventType.InitResult:
                _initialized = true;
                _logger.Info("[BridgeHost] Bridge initialized (confirmed by JS)");
                Initialized?.Invoke(this, EventArgs.Empty);
                break;
        }
    }

    private async Task HandleInitAsync(JsonElement data)
    {
        var initData = JsonSerializer.Deserialize<BridgeInitData>(data.GetRawText(), _jsonOptions);
        if (initData != null)
        {
            lock (_lock)
            {
                _supportedMethods.Clear();
                _supportedMethods.AddRange(initData.Methods);
            }
            _logger.Info($"[BridgeHost] JS supports methods: {string.Join(", ", initData.Methods)}");
        }

        string[] ourMethods;
        lock (_lock)
        {
            ourMethods = _handlers.Keys.ToArray();
        }

        await SendEventAsync(BridgeEventType.Init, new BridgeInitData { Methods = ourMethods });
        _logger.Info($"[BridgeHost] Sent Init with methods: {string.Join(", ", ourMethods)}");

        await SendEventAsync(BridgeEventType.InitResult, new BridgeInitData { Methods = ourMethods });
    }

    private async Task HandleRequestAsync(JsonElement data)
    {
        var request = JsonSerializer.Deserialize<BridgeRequestData>(data.GetRawText(), _jsonOptions);
        if (request == null) return;

        BridgeResultData result;
        Func<JsonElement, Task<object?>>? handler;

        lock (_lock)
        {
            _handlers.TryGetValue(request.Method, out handler);
        }

        if (handler != null)
        {
            try
            {
                var handlerResult = await handler(request.Params);
                result = new BridgeResultData
                {
                    Type = BridgeResultType.Success,
                    Method = request.Method,
                    RequestId = request.RequestId,
                    Data = JsonSerializer.SerializeToElement(handlerResult, _jsonOptions)
                };
                _logger.Debug($"[BridgeHost] Handler '{request.Method}' completed successfully");
            }
            catch (Exception ex)
            {
                _logger.Error($"[BridgeHost] Handler '{request.Method}' failed", ex);
                result = new BridgeResultData
                {
                    Type = BridgeResultType.Error,
                    Method = request.Method,
                    RequestId = request.RequestId,
                    Error = new BridgeResultError
                    {
                        ErrorType = BridgeErrorType.REJECTED,
                        ErrorMessage = ex.Message
                    }
                };
            }
        }
        else
        {
            _logger.Warn($"[BridgeHost] Unknown method: {request.Method}");
            result = new BridgeResultData
            {
                Type = BridgeResultType.Error,
                Method = request.Method,
                RequestId = request.RequestId,
                Error = new BridgeResultError
                {
                    ErrorType = BridgeErrorType.UNSUPPORTED_METHOD,
                    ErrorMessage = $"Method '{request.Method}' is not registered"
                }
            };
        }

        await SendResultAsync(result);
    }

    private void HandleResult(JsonElement data)
    {
        var result = JsonSerializer.Deserialize<BridgeResultData>(data.GetRawText(), _jsonOptions);
        if (result?.RequestId == null) return;

        TaskCompletionSource<JsonElement>? tcs;
        lock (_lock)
        {
            if (!_pendingRequests.TryGetValue(result.RequestId, out tcs))
                return;
            _pendingRequests.Remove(result.RequestId);
        }

        if (result.Type == BridgeResultType.Success && result.Data.HasValue)
        {
            tcs.TrySetResult(result.Data.Value);
        }
        else if (result.Error != null)
        {
            tcs.TrySetException(new BridgeException(result.Error.ErrorType, result.Error.ErrorMessage));
        }
    }

    /// <summary>
    /// Sends an event to JavaScript via window.postMessage.
    /// </summary>
    public async Task SendEventAsync(BridgeEventType type, object data)
    {
        var innerEvent = new BridgeEventPayload
        {
            Type = type,
            Data = JsonSerializer.SerializeToElement(data, _jsonOptions)
        };

        var wrapper = new { type = "BridgeEvent", @event = innerEvent };
        var json = JsonSerializer.Serialize(wrapper, _jsonOptions);
        var jsonString = JsonSerializer.Serialize(json);
        var script = $"window.postMessage({jsonString}, '*');";

        await _browserBridge.ExecuteScriptAsync(script);
        _logger.Debug($"[BridgeHost] Sent: {json}");
    }

    private Task SendResultAsync(BridgeResultData result) => SendEventAsync(BridgeEventType.Result, result);

    /// <summary>
    /// Sends a request to the JavaScript side and awaits the response.
    /// </summary>
    public async Task<T?> SendAsync<T>(string method, object? parameters = null, int timeoutMs = 100000)
    {
        if (!_initialized)
            throw new InvalidOperationException("Bridge not initialized");

        lock (_lock)
        {
            if (!_supportedMethods.Contains(method))
                throw new InvalidOperationException($"Method '{method}' not supported by JS side");
        }

        var requestId = Interlocked.Increment(ref _requestIdCounter).ToString();
        var tcs = new TaskCompletionSource<JsonElement>();

        lock (_lock)
        {
            _pendingRequests[requestId] = tcs;
        }

        var requestData = new BridgeRequestData
        {
            Method = method,
            RequestId = requestId,
            Params = JsonSerializer.SerializeToElement(parameters ?? new { }, _jsonOptions)
        };

        await SendEventAsync(BridgeEventType.Request, requestData);
        _logger.Debug($"[BridgeHost] Sent request: {method} (id={requestId})");

        using var cts = new CancellationTokenSource(timeoutMs);
        cts.Token.Register(() =>
        {
            lock (_lock)
            {
                if (_pendingRequests.Remove(requestId))
                {
                    tcs.TrySetException(new BridgeException(
                        BridgeErrorType.METHOD_EXECUTION_TIMEOUT,
                        $"Request '{method}' timed out after {timeoutMs}ms"));
                }
            }
        });

        var result = await tcs.Task;
        return JsonSerializer.Deserialize<T>(result.GetRawText(), _jsonOptions);
    }

    #region Handler Registration

    /// <summary>
    /// Registers a raw handler for a method.
    /// </summary>
    public void RegisterHandler(string method, Func<JsonElement, Task<object?>> handler)
    {
        lock (_lock)
        {
            _handlers[method] = handler;
        }
        _logger.Info($"[BridgeHost] Registered handler: {method}");
    }

    /// <summary>
    /// Registers a typed handler for a method.
    /// </summary>
    public void RegisterHandler<TParams, TResult>(string methodName, Func<TParams, Task<TResult>> handler)
    {
        RegisterHandler(methodName, async (JsonElement paramsJson) =>
        {
            var parameters = JsonSerializer.Deserialize<TParams>(paramsJson.GetRawText(), _jsonOptions)
                ?? throw new ArgumentException($"Failed to deserialize params for {methodName}");
            return await handler(parameters);
        });
    }

    /// <summary>
    /// Registers a handler with no parameters.
    /// </summary>
    public void RegisterHandler<TResult>(string methodName, Func<Task<TResult>> handler)
    {
        RegisterHandler(methodName, async (JsonElement _) => await handler());
    }

    /// <summary>
    /// Registers a handler implementing IBridgeHandler.
    /// </summary>
    public void RegisterHandler<TParams, TResult>(IBridgeHandler<TParams, TResult> handler)
    {
        RegisterHandler<TParams, TResult>(handler.MethodName, handler.HandleAsync);
    }

    /// <summary>
    /// Removes a previously registered handler.
    /// </summary>
    public void UnregisterHandler(string method)
    {
        lock (_lock)
        {
            _handlers.Remove(method);
        }
        _logger.Info($"[BridgeHost] Unregistered handler: {method}");
    }

    #endregion

    /// <summary>
    /// Sends the Init event to JavaScript with the list of registered methods.
    /// </summary>
    public async Task InitializeAsync()
    {
        string[] methods;
        lock (_lock)
        {
            methods = _handlers.Keys.ToArray();
        }
        await SendEventAsync(BridgeEventType.Init, new BridgeInitData { Methods = methods });
        _logger.Info($"[BridgeHost] Sent Init with methods: {string.Join(", ", methods)}");
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        _browserBridge.MessageReceived -= OnMessageReceived;
        _browserBridge.Dispose();

        lock (_lock)
        {
            foreach (var pending in _pendingRequests.Values)
            {
                pending.TrySetCanceled();
            }
            _pendingRequests.Clear();
        }

        GC.SuppressFinalize(this);
        _logger.Info("[BridgeHost] Disposed");
    }
}

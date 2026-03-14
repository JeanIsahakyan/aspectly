using System.Text.Json;
using System.Text.Json.Serialization;
using Aspectly.Bridge;
using Aspectly.Bridge.Protocol;
using FluentAssertions;
using Moq;
using Xunit;

namespace Aspectly.Bridge.Tests;

public class BridgeHostTests
{
    private readonly Mock<IBrowserBridge> _mockBrowser;
    private readonly BridgeHost _bridge;

    public BridgeHostTests()
    {
        _mockBrowser = new Mock<IBrowserBridge>();
        _mockBrowser.Setup(b => b.IsReady).Returns(true);
        _bridge = new BridgeHost(_mockBrowser.Object);
    }

    [Fact]
    public void Constructor_ShouldSubscribeToMessages()
    {
        _mockBrowser.VerifyAdd(b => b.MessageReceived += It.IsAny<EventHandler<BrowserMessageEventArgs>>(), Times.Once);
    }

    [Fact]
    public void RegisterHandler_ShouldAddHandler()
    {
        _bridge.RegisterHandler("test", async (_) => "result");

        _bridge.RegisteredMethods.Should().Contain("test");
    }

    [Fact]
    public void UnregisterHandler_ShouldRemoveHandler()
    {
        _bridge.RegisterHandler("test", async (_) => "result");
        _bridge.UnregisterHandler("test");

        _bridge.RegisteredMethods.Should().NotContain("test");
    }

    [Fact]
    public async Task ProcessMessageAsync_WithInitEvent_ShouldUpdateSupportedMethods()
    {
        var initMessage = CreateBridgeMessage(BridgeEventType.Init, new { methods = new[] { "jsMethod1", "jsMethod2" } });

        await _bridge.ProcessMessageAsync(initMessage);

        _bridge.SupportedMethods.Should().Contain("jsMethod1");
        _bridge.SupportedMethods.Should().Contain("jsMethod2");
    }

    [Fact]
    public async Task ProcessMessageAsync_WithRequestEvent_ShouldCallHandler()
    {
        var handlerCalled = false;
        _bridge.RegisterHandler("testMethod", async (JsonElement _) =>
        {
            handlerCalled = true;
            return new { success = true };
        });

        var requestMessage = CreateBridgeMessage(BridgeEventType.Request, new
        {
            method = "testMethod",
            request_id = "1",
            @params = new { }
        });

        await _bridge.ProcessMessageAsync(requestMessage);

        handlerCalled.Should().BeTrue();
    }

    [Fact]
    public async Task ProcessMessageAsync_WithUnknownMethod_ShouldSendError()
    {
        string? sentScript = null;
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Callback<string>(s => sentScript = s)
            .Returns(Task.CompletedTask);

        var requestMessage = CreateBridgeMessage(BridgeEventType.Request, new
        {
            method = "unknownMethod",
            request_id = "1",
            @params = new { }
        });

        await _bridge.ProcessMessageAsync(requestMessage);

        sentScript.Should().Contain("UNSUPPORTED_METHOD");
    }

    [Fact]
    public void Dispose_ShouldUnsubscribeFromMessages()
    {
        _bridge.Dispose();

        _mockBrowser.VerifyRemove(b => b.MessageReceived -= It.IsAny<EventHandler<BrowserMessageEventArgs>>(), Times.Once);
    }

    [Fact]
    public async Task Dispose_ShouldCancelPendingRequests()
    {
        // Set up initialized bridge with a supported method
        var initMessage = CreateBridgeMessage(BridgeEventType.Init, new { methods = new[] { "jsMethod" } });
        await _bridge.ProcessMessageAsync(initMessage);

        var initResultMessage = CreateBridgeMessage(BridgeEventType.InitResult, new { methods = new[] { "jsMethod" } });
        await _bridge.ProcessMessageAsync(initResultMessage);

        // Start SendAsync call (do not await)
        var sendTask = _bridge.SendAsync<string>("jsMethod");

        // Dispose before result arrives
        _bridge.Dispose();

        // Assert TaskCanceledException is thrown
        await Assert.ThrowsAsync<TaskCanceledException>(async () => await sendTask);
    }

    [Fact]
    public void Dispose_ShouldDisposeBrowserBridge()
    {
        _bridge.Dispose();

        _mockBrowser.Verify(b => b.Dispose(), Times.Once);
    }

    [Fact]
    public void Dispose_CalledTwice_ShouldNotThrow()
    {
        _bridge.Dispose();

        // Should not throw
        _bridge.Dispose();
    }

    [Fact]
    public async Task RegisterHandler_WithSameName_ShouldOverwrite()
    {
        string? sentScript = null;
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Callback<string>(s => sentScript = s)
            .Returns(Task.CompletedTask);

        // Register first handler
        _bridge.RegisterHandler("test", async (_) => "first");

        // Register second handler with same name
        _bridge.RegisterHandler("test", async (_) => "second");

        // Process request for "test"
        var requestMessage = CreateBridgeMessage(BridgeEventType.Request, new
        {
            method = "test",
            request_id = "1",
            @params = new { }
        });

        await _bridge.ProcessMessageAsync(requestMessage);

        // Verify response contains "second"
        sentScript.Should().NotBeNull();
        sentScript.Should().Contain("second");
    }

    [Fact]
    public async Task ProcessMessageAsync_WithSuccessResult_ShouldResolvePendingRequest()
    {
        string? capturedScript = null;
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Callback<string>(s => capturedScript = s)
            .Returns(Task.CompletedTask);

        // Initialize bridge
        var initMessage = CreateBridgeMessage(BridgeEventType.Init, new { methods = new[] { "jsMethod" } });
        await _bridge.ProcessMessageAsync(initMessage);

        var initResultMessage = CreateBridgeMessage(BridgeEventType.InitResult, new { methods = new[] { "jsMethod" } });
        await _bridge.ProcessMessageAsync(initResultMessage);

        // Start SendAsync (do not await)
        var sendTask = _bridge.SendAsync<string>("jsMethod");

        // Extract request_id from captured ExecuteScriptAsync call
        capturedScript.Should().NotBeNull();
        var requestId = ExtractRequestIdFromScript(capturedScript!);

        // Process Result event with matching request_id and success data
        var resultMessage = CreateBridgeMessage(BridgeEventType.Result, new
        {
            type = "Success",
            data = "test result",
            request_id = requestId
        });

        await _bridge.ProcessMessageAsync(resultMessage);

        // Await the SendAsync task
        var result = await sendTask;

        // Assert result matches expected data
        result.Should().Be("test result");
    }

    [Fact]
    public async Task ProcessMessageAsync_WithErrorResult_ShouldRejectWithBridgeException()
    {
        string? capturedScript = null;
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Callback<string>(s => capturedScript = s)
            .Returns(Task.CompletedTask);

        // Initialize bridge
        var initMessage = CreateBridgeMessage(BridgeEventType.Init, new { methods = new[] { "jsMethod" } });
        await _bridge.ProcessMessageAsync(initMessage);

        var initResultMessage = CreateBridgeMessage(BridgeEventType.InitResult, new { methods = new[] { "jsMethod" } });
        await _bridge.ProcessMessageAsync(initResultMessage);

        // Start SendAsync (do not await)
        var sendTask = _bridge.SendAsync<string>("jsMethod");

        // Extract request_id from captured ExecuteScriptAsync call
        capturedScript.Should().NotBeNull();
        var requestId = ExtractRequestIdFromScript(capturedScript!);

        // Process Result event with Error type and REJECTED error
        var resultMessage = CreateBridgeMessage(BridgeEventType.Result, new
        {
            type = "Error",
            error = new
            {
                error_type = "REJECTED",
                error_message = "Method failed"
            },
            request_id = requestId
        });

        await _bridge.ProcessMessageAsync(resultMessage);

        // Assert BridgeException is thrown with correct ErrorType
        var exception = await Assert.ThrowsAsync<BridgeException>(async () => await sendTask);
        exception.ErrorType.Should().Be(BridgeErrorType.REJECTED);
        exception.Message.Should().Contain("Method failed");
    }

    [Fact]
    public async Task SendAsync_WithTimeout_ShouldThrowTimeoutException()
    {
        // Initialize bridge with supported method
        var initMessage = CreateBridgeMessage(BridgeEventType.Init, new { methods = new[] { "jsMethod" } });
        await _bridge.ProcessMessageAsync(initMessage);

        var initResultMessage = CreateBridgeMessage(BridgeEventType.InitResult, new { methods = new[] { "jsMethod" } });
        await _bridge.ProcessMessageAsync(initResultMessage);

        // Call SendAsync with short timeout
        var sendTask = _bridge.SendAsync<string>("jsMethod", null, timeoutMs: 100);

        // Do not send any Result - wait for timeout
        var exception = await Assert.ThrowsAsync<BridgeException>(async () => await sendTask);
        exception.ErrorType.Should().Be(BridgeErrorType.METHOD_EXECUTION_TIMEOUT);
    }

    [Fact]
    public async Task SendAsync_BeforeInitialization_ShouldThrowInvalidOperationException()
    {
        // Do not initialize bridge
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _bridge.SendAsync<string>("anyMethod"));
    }

    [Fact]
    public async Task SendAsync_UnsupportedMethod_ShouldThrowInvalidOperationException()
    {
        // Initialize bridge without adding the method to supported
        var initMessage = CreateBridgeMessage(BridgeEventType.Init, new { methods = new[] { "otherMethod" } });
        await _bridge.ProcessMessageAsync(initMessage);

        var initResultMessage = CreateBridgeMessage(BridgeEventType.InitResult, new { methods = new[] { "otherMethod" } });
        await _bridge.ProcessMessageAsync(initResultMessage);

        // Call SendAsync for unsupported method
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _bridge.SendAsync<string>("unknownMethod"));
    }

    [Fact]
    public async Task ProcessMessageAsync_WithRequest_HandlerReturnsData_ShouldSendSuccessResult()
    {
        string? sentScript = null;
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Callback<string>(s => sentScript = s)
            .Returns(Task.CompletedTask);

        // Register handler returning { value = 42 }
        _bridge.RegisterHandler("testMethod", async (_) => new { value = 42 });

        // Process Request event
        var requestMessage = CreateBridgeMessage(BridgeEventType.Request, new
        {
            method = "testMethod",
            request_id = "test-123",
            @params = new { }
        });

        await _bridge.ProcessMessageAsync(requestMessage);

        // Verify ExecuteScriptAsync was called with JSON containing "Success" and "42"
        sentScript.Should().NotBeNull();
        sentScript.Should().Contain("Success");
        sentScript.Should().Contain("42");
    }

    [Fact]
    public async Task ProcessMessageAsync_WithRequest_HandlerThrows_ShouldSendRejectedError()
    {
        string? sentScript = null;
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Callback<string>(s => sentScript = s)
            .Returns(Task.CompletedTask);

        // Register handler that throws
        _bridge.RegisterHandler("testMethod", async (_) =>
        {
            throw new Exception("test error");
        });

        // Process Request event
        var requestMessage = CreateBridgeMessage(BridgeEventType.Request, new
        {
            method = "testMethod",
            request_id = "test-123",
            @params = new { }
        });

        await _bridge.ProcessMessageAsync(requestMessage);

        // Verify ExecuteScriptAsync was called with JSON containing "REJECTED" and "test error"
        sentScript.Should().NotBeNull();
        sentScript.Should().Contain("REJECTED");
        sentScript.Should().Contain("test error");
    }

    [Fact]
    public async Task ProcessMessageAsync_WithEmptyString_ShouldBeIgnored()
    {
        var executeCalled = false;
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Callback(() => executeCalled = true)
            .Returns(Task.CompletedTask);

        // Process empty string
        await _bridge.ProcessMessageAsync("");

        // Verify no ExecuteScriptAsync calls
        executeCalled.Should().BeFalse();
    }

    [Fact]
    public async Task ProcessMessageAsync_WithInvalidJson_ShouldBeIgnored()
    {
        var executeCalled = false;
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Callback(() => executeCalled = true)
            .Returns(Task.CompletedTask);

        // Process invalid JSON
        await _bridge.ProcessMessageAsync("not json {");

        // Verify no exception, no ExecuteScriptAsync calls
        executeCalled.Should().BeFalse();
    }

    [Fact]
    public async Task ProcessMessageAsync_WithNonBridgeEvent_ShouldBeIgnored()
    {
        var executeCalled = false;
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Callback(() => executeCalled = true)
            .Returns(Task.CompletedTask);

        // Process JSON with type = "OtherEvent"
        var message = JsonSerializer.Serialize(new { type = "OtherEvent", data = new { } });
        await _bridge.ProcessMessageAsync(message);

        // Verify no ExecuteScriptAsync calls
        executeCalled.Should().BeFalse();
    }

    [Fact]
    public async Task ProcessMessageAsync_WithInitResult_ShouldSetInitializedAndFireEvent()
    {
        var eventFired = false;
        _bridge.Initialized += (sender, args) => eventFired = true;

        // Process InitResult message
        var initResultMessage = CreateBridgeMessage(BridgeEventType.InitResult, true);
        await _bridge.ProcessMessageAsync(initResultMessage);

        // Assert IsInitialized == true and event was raised
        _bridge.IsInitialized.Should().BeTrue();
        eventFired.Should().BeTrue();
    }

    [Fact]
    public async Task InitializeAsync_ShouldWaitForInitResult()
    {
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Start InitializeAsync (will send Init and wait for InitResult)
        var initTask = _bridge.InitializeAsync();

        // Should not be completed yet (waiting for InitResult)
        initTask.IsCompleted.Should().BeFalse();

        // Simulate JS responding with InitResult
        var initResultMessage = CreateBridgeMessage(BridgeEventType.InitResult, true);
        await _bridge.ProcessMessageAsync(initResultMessage);

        // Now InitializeAsync should complete
        await initTask;
        _bridge.IsInitialized.Should().BeTrue();
    }

    [Fact]
    public async Task InitializeAsync_ShouldBeCancelledOnDispose()
    {
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Start InitializeAsync (will wait for InitResult)
        var initTask = _bridge.InitializeAsync();

        // Dispose before InitResult arrives
        _bridge.Dispose();

        // Should throw TaskCanceledException
        await Assert.ThrowsAsync<TaskCanceledException>(async () => await initTask);
    }

    [Fact]
    public async Task HandleInit_ShouldOnlySendInitResult_NotOurInit()
    {
        var sentScripts = new List<string>();
        _mockBrowser.Setup(b => b.ExecuteScriptAsync(It.IsAny<string>()))
            .Callback<string>(s => sentScripts.Add(s))
            .Returns(Task.CompletedTask);

        // Register a handler so we have methods
        _bridge.RegisterHandler("myMethod", async (_) => "result");

        // Process JS Init
        var initMessage = CreateBridgeMessage(BridgeEventType.Init, new { methods = new[] { "jsMethod" } });
        await _bridge.ProcessMessageAsync(initMessage);

        // Should have sent exactly one message (InitResult), not two (Init + InitResult)
        sentScripts.Should().HaveCount(1);
        sentScripts[0].Should().Contain("InitResult");
        sentScripts[0].Should().NotContain("\"type\":\"Init\"");
    }

    private static string ExtractRequestIdFromScript(string script)
    {
        // Script format: window.postMessage(<json-encoded-string>, '*');
        // The inner value is a JSON string token produced by JsonSerializer.Serialize(json)
        var startIndex = script.IndexOf("window.postMessage(") + "window.postMessage(".Length;
        var endIndex = script.LastIndexOf(", '*');");
        var jsonStringToken = script.Substring(startIndex, endIndex - startIndex);

        // Deserialize the JSON string token to get the actual JSON
        var json = JsonSerializer.Deserialize<string>(jsonStringToken)!;

        var doc = JsonDocument.Parse(json);
        var eventData = doc.RootElement.GetProperty("event").GetProperty("data");
        return eventData.GetProperty("request_id").GetString() ?? string.Empty;
    }

    private static string CreateBridgeMessage(BridgeEventType type, object data)
    {
        var payload = new { type = type.ToString(), data };
        var wrapper = new { type = "BridgeEvent", @event = payload };
        return JsonSerializer.Serialize(wrapper);
    }
}

public class ProtocolTests
{
    [Fact]
    public void BridgeEventType_ShouldSerializeAsString()
    {
        var options = new JsonSerializerOptions();
        var json = JsonSerializer.Serialize(BridgeEventType.Request, options);
        json.Should().Contain("Request");
    }

    [Fact]
    public void BridgeEventType_ShouldDeserializeFromString()
    {
        var json = "\"Request\"";
        var options = new JsonSerializerOptions
        {
            Converters = { new JsonStringEnumConverter() }
        };
        var eventType = JsonSerializer.Deserialize<BridgeEventType>(json, options);
        eventType.Should().Be(BridgeEventType.Request);
    }

    [Fact]
    public void BridgeErrorType_ShouldSerializeAsString()
    {
        var options = new JsonSerializerOptions();
        var json = JsonSerializer.Serialize(BridgeErrorType.UNSUPPORTED_METHOD, options);
        json.Should().Contain("UNSUPPORTED_METHOD");
    }

    [Fact]
    public void BridgeResultType_ShouldSerialize()
    {
        var options = new JsonSerializerOptions
        {
            Converters = { new JsonStringEnumConverter() }
        };
        var successJson = JsonSerializer.Serialize(BridgeResultType.Success, options);
        var errorJson = JsonSerializer.Serialize(BridgeResultType.Error, options);

        successJson.Should().Contain("Success");
        errorJson.Should().Contain("Error");
    }

    [Fact]
    public void BridgeInitData_ShouldDeserialize()
    {
        var json = "{\"methods\":[\"a\",\"b\"]}";
        var data = JsonSerializer.Deserialize<BridgeInitData>(json);

        data.Should().NotBeNull();
        data!.Methods.Should().BeEquivalentTo(new[] { "a", "b" });
    }

    [Fact]
    public void BridgeInitData_ShouldSerialize()
    {
        var data = new BridgeInitData { Methods = new[] { "a", "b" } };
        var json = JsonSerializer.Serialize(data);

        json.Should().Contain("\"methods\"");
        json.Should().Contain("\"a\"");
        json.Should().Contain("\"b\"");
    }

    [Fact]
    public void BridgeRequestData_ShouldRoundTrip()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var original = new BridgeRequestData
        {
            Method = "testMethod",
            RequestId = "req-123",
            Params = JsonSerializer.SerializeToElement(new { value = 42 }, options)
        };

        var json = JsonSerializer.Serialize(original, options);
        var deserialized = JsonSerializer.Deserialize<BridgeRequestData>(json, options);

        deserialized.Should().NotBeNull();
        deserialized!.Method.Should().Be("testMethod");
        deserialized.RequestId.Should().Be("req-123");
        deserialized.Params.GetProperty("value").GetInt32().Should().Be(42);
    }
}

public class BridgeExceptionTests
{
    [Fact]
    public void Constructor_ShouldSetErrorType()
    {
        var ex = new BridgeException(BridgeErrorType.REJECTED, "test");

        ex.ErrorType.Should().Be(BridgeErrorType.REJECTED);
        ex.Message.Should().Be("test");
    }

    [Fact]
    public void Constructor_WithInnerException_ShouldSetAll()
    {
        var innerException = new InvalidOperationException("inner error");
        var ex = new BridgeException(BridgeErrorType.BRIDGE_NOT_AVAILABLE, "outer error", innerException);

        ex.ErrorType.Should().Be(BridgeErrorType.BRIDGE_NOT_AVAILABLE);
        ex.Message.Should().Be("outer error");
        ex.InnerException.Should().Be(innerException);
        ex.InnerException!.Message.Should().Be("inner error");
    }
}

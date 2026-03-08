# Test Plan — Aspectly.Bridge

## Текущее покрытие: ~40%

---

## 1. BridgeHost

### 1.1 Constructor & Lifecycle
- [x] Constructor подписывается на MessageReceived
- [x] Dispose отписывается от MessageReceived
- [x] Dispose отменяет pending requests
- [x] Dispose вызывает Dispose на IBrowserBridge
- [x] Double dispose не бросает исключение

### 1.2 Handler Registration
- [x] RegisterHandler добавляет метод в RegisteredMethods
- [x] UnregisterHandler удаляет метод
- [ ] RegisterHandler<TParams, TResult> — typed handler
- [ ] RegisterHandler<TResult> — no params handler
- [ ] RegisterHandler(IBridgeHandler) — interface handler
- [x] Перезапись handler с тем же именем

### 1.3 ProcessMessageAsync — Init Flow
- [x] Init event обновляет SupportedMethods
- [ ] Init event отправляет наши methods в ответ
- [ ] Init event отправляет InitResult
- [x] InitResult event устанавливает IsInitialized = true
- [x] InitResult event вызывает Initialized event

### 1.4 ProcessMessageAsync — Request Flow
- [x] Request вызывает зарегистрированный handler
- [x] Unknown method возвращает UNSUPPORTED_METHOD
- [x] Handler успешно возвращает данные → Success result
- [x] Handler бросает exception → REJECTED error
- [ ] Handler получает правильные params (десериализация)
- [ ] Result отправляется с правильным request_id

### 1.5 ProcessMessageAsync — Result Flow
- [x] Success result резолвит pending request
- [x] Error result реджектит pending request с BridgeException
- [ ] Result с неизвестным request_id игнорируется

### 1.6 ProcessMessageAsync — Edge Cases
- [x] Пустая строка игнорируется
- [x] Невалидный JSON логируется и игнорируется
- [x] Non-BridgeEvent message игнорируется
- [ ] Null data в payload обрабатывается

### 1.7 SendAsync<T>
- [x] Успешный вызов возвращает десериализованный результат
- [x] Timeout бросает METHOD_EXECUTION_TIMEOUT
- [x] Вызов до инициализации бросает InvalidOperationException
- [x] Вызов неподдерживаемого метода бросает InvalidOperationException
- [ ] Request_id уникален для каждого запроса

### 1.8 InitializeAsync
- [ ] Отправляет Init event с RegisteredMethods
- [ ] Формат сообщения соответствует протоколу

### 1.9 Thread Safety
- [ ] Concurrent RegisterHandler не ломает state
- [ ] Concurrent SendAsync работает корректно
- [ ] Concurrent ProcessMessageAsync работает корректно

---

## 2. Protocol Classes

### 2.1 BridgeEventType
- [x] Сериализуется как string (не int)
- [x] Десериализуется из string
- [ ] Все значения: Init, InitResult, Request, Result

### 2.2 BridgeErrorType
- [x] Сериализуется как string
- [ ] Все значения: METHOD_EXECUTION_TIMEOUT, UNSUPPORTED_METHOD, REJECTED, BRIDGE_NOT_AVAILABLE

### 2.3 BridgeResultType
- [x] Success/Error сериализуются корректно

### 2.4 BridgeInitData
- [x] Десериализация methods array
- [x] Сериализация methods array
- [ ] Пустой массив methods

### 2.5 BridgeRequestData
- [x] Сериализация/десериализация method, params, request_id
- [x] Params как JsonElement сохраняет структуру

### 2.6 BridgeResultData
- [ ] Success с data
- [ ] Error с BridgeResultError
- [ ] Nullable fields (Data, Error, Method, RequestId)

### 2.7 BridgeEventWrapper
- [ ] type = "BridgeEvent"
- [ ] event как JsonElement

### 2.8 BridgeEventPayload
- [ ] type + data parsing

---

## 3. BridgeException

- [x] Constructor устанавливает ErrorType и Message
- [x] Constructor с innerException
- [x] ErrorType доступен после создания

---

## 4. Logger

### 4.1 ConsoleLogger
- [ ] Debug/Info/Warn/Error пишут в Console

### 4.2 NullLogger
- [ ] Все методы no-op
- [ ] Singleton Instance

### 4.3 BridgeHost + Logger
- [ ] Debug логи при получении/отправке сообщений
- [ ] Info логи при регистрации handlers
- [ ] Warn логи для unknown methods
- [ ] Error логи при exceptions

---

## 5. IBrowserBridge Implementations

### 5.1 CefSharpBrowserBridge
- [ ] Constructor подписывается на JavascriptMessageReceived
- [ ] MessageReceived срабатывает при получении сообщения
- [ ] ExecuteScriptAsync вызывает EvaluateScriptAsync
- [ ] IsReady возвращает IsBrowserInitialized
- [ ] Dispose отписывается от событий
- [ ] ExecuteScriptAsync до инициализации бросает exception

### 5.2 WebView2BrowserBridge
- [ ] Constructor подписывается на WebMessageReceived
- [ ] MessageReceived срабатывает при получении сообщения
- [ ] ExecuteScriptAsync вызывает CoreWebView2.ExecuteScriptAsync
- [ ] IsReady проверяет CoreWebView2 != null
- [ ] Dispose отписывается от событий

---

## 6. Integration Tests

- [ ] Full Init handshake (C# ↔ mock JS)
- [ ] Request → Handler → Result flow
- [ ] Bidirectional communication
- [ ] Multiple concurrent requests
- [ ] Timeout scenario

---

## Приоритеты

1. **High**: SendAsync, Result handling, Timeout
2. **Medium**: Typed handlers, Error cases, Thread safety
3. **Low**: Logger, Edge cases

---

## Запуск тестов

```bash
cd aspectly/dotnet
dotnet test --collect:"XPlat Code Coverage"
dotnet reportgenerator -reports:coverage.xml -targetdir:coverage-report
```

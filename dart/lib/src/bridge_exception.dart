import 'protocol.dart';

/// Exception type for bridge protocol errors. The Dart equivalent of .NET's
/// `BridgeException` / Swift's `BridgeError`.
class BridgeException implements Exception {
  /// One of the [BridgeErrorType] values.
  final String errorType;

  /// Human-readable error message.
  final String message;

  BridgeException(this.errorType, [String? message])
      : message = message ?? errorType;

  @override
  String toString() => 'BridgeException($errorType): $message';
}

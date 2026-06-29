import Foundation

/// A type-erased JSON value, the Swift equivalent of .NET's `JsonElement`.
///
/// `JSONValue` is the universal representation used by the bridge to carry
/// dynamic request parameters and result payloads across the boundary while
/// remaining fully `Codable`.
public enum JSONValue: Codable, Equatable {
    case null
    case bool(Bool)
    case int(Int)
    case double(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
            return
        }
        // Order matters: probe Int before Double so whole numbers stay `.int`,
        // and probe numbers before Bool to avoid the NSNumber 1/0 <-> true/false
        // ambiguity in Foundation's JSON decoder.
        if let intValue = try? container.decode(Int.self) {
            self = .int(intValue)
            return
        }
        if let doubleValue = try? container.decode(Double.self) {
            self = .double(doubleValue)
            return
        }
        if let boolValue = try? container.decode(Bool.self) {
            self = .bool(boolValue)
            return
        }
        if let stringValue = try? container.decode(String.self) {
            self = .string(stringValue)
            return
        }
        if let arrayValue = try? container.decode([JSONValue].self) {
            self = .array(arrayValue)
            return
        }
        if let objectValue = try? container.decode([String: JSONValue].self) {
            self = .object(objectValue)
            return
        }
        throw DecodingError.dataCorruptedError(
            in: container,
            debugDescription: "Unsupported JSON value"
        )
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null:
            try container.encodeNil()
        case .bool(let value):
            try container.encode(value)
        case .int(let value):
            try container.encode(value)
        case .double(let value):
            try container.encode(value)
        case .string(let value):
            try container.encode(value)
        case .array(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        }
    }
}

// MARK: - Construction & conversion

public extension JSONValue {
    /// Parse a JSON string into a `JSONValue` tree.
    init(jsonString: String) throws {
        guard let data = jsonString.data(using: .utf8) else {
            throw JSONValueError.invalidUTF8
        }
        self = try JSONDecoder().decode(JSONValue.self, from: data)
    }

    /// Build a `JSONValue` from any `Encodable` value (objects, scalars, arrays).
    init(encoding value: Encodable) throws {
        let data = try JSONEncoder().encode(AnyEncodable(value))
        self = try JSONDecoder().decode(JSONValue.self, from: data)
    }

    /// Serialize this value to compact JSON `Data`.
    func data() throws -> Data {
        try JSONEncoder().encode(self)
    }

    /// Serialize this value to a compact JSON string.
    func jsonString() throws -> String {
        String(decoding: try data(), as: UTF8.self)
    }

    /// Decode this value into a concrete `Decodable` type.
    func decode<T: Decodable>(_ type: T.Type) throws -> T {
        try JSONDecoder().decode(type, from: try data())
    }
}

// MARK: - Accessors

public extension JSONValue {
    subscript(key: String) -> JSONValue? {
        if case .object(let dictionary) = self {
            return dictionary[key]
        }
        return nil
    }

    var stringValue: String? {
        if case .string(let value) = self { return value }
        return nil
    }

    var boolValue: Bool? {
        if case .bool(let value) = self { return value }
        return nil
    }

    var intValue: Int? {
        switch self {
        case .int(let value): return value
        case .double(let value): return Int(value)
        default: return nil
        }
    }

    var doubleValue: Double? {
        switch self {
        case .double(let value): return value
        case .int(let value): return Double(value)
        default: return nil
        }
    }

    var arrayValue: [JSONValue]? {
        if case .array(let value) = self { return value }
        return nil
    }

    var objectValue: [String: JSONValue]? {
        if case .object(let value) = self { return value }
        return nil
    }

    /// Convenience: an array of strings (e.g. the `methods` list during init).
    var stringArray: [String]? {
        arrayValue?.compactMap { $0.stringValue }
    }

    var isNull: Bool {
        if case .null = self { return true }
        return false
    }
}

/// Errors thrown when working with `JSONValue`.
public enum JSONValueError: Error {
    case invalidUTF8
}

/// Internal wrapper that lets us encode an existential `Encodable`.
struct AnyEncodable: Encodable {
    private let value: Encodable

    init(_ value: Encodable) {
        self.value = value
    }

    func encode(to encoder: Encoder) throws {
        try value.encode(to: encoder)
    }
}

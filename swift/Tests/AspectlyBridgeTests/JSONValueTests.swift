import XCTest
@testable import AspectlyBridge

final class JSONValueTests: XCTestCase {
    func testRoundTripObject() throws {
        let json = #"{"name":"John","age":30,"active":true,"score":9.5,"tags":["a","b"],"nested":{"x":1}}"#
        let value = try JSONValue(jsonString: json)

        XCTAssertEqual(value["name"]?.stringValue, "John")
        XCTAssertEqual(value["age"]?.intValue, 30)
        XCTAssertEqual(value["active"]?.boolValue, true)
        XCTAssertEqual(value["score"]?.doubleValue, 9.5)
        XCTAssertEqual(value["tags"]?.stringArray, ["a", "b"])
        XCTAssertEqual(value["nested"]?["x"]?.intValue, 1)
    }

    func testBoolAndIntAreNotConfused() throws {
        let value = try JSONValue(jsonString: #"{"flag":true,"count":1,"zero":0}"#)
        XCTAssertEqual(value["flag"], .bool(true))
        XCTAssertEqual(value["count"], .int(1))
        XCTAssertEqual(value["zero"], .int(0))
    }

    func testEncodeFromEncodableScalarAndObject() throws {
        struct Payload: Encodable { let message: String; let value: Int }
        let value = try JSONValue(encoding: Payload(message: "hi", value: 7))
        XCTAssertEqual(value["message"]?.stringValue, "hi")
        XCTAssertEqual(value["value"]?.intValue, 7)

        let scalar = try JSONValue(encoding: "pong")
        XCTAssertEqual(scalar.stringValue, "pong")

        let number = try JSONValue(encoding: 42)
        XCTAssertEqual(number.intValue, 42)
    }

    func testDecodeIntoConcreteType() throws {
        struct Point: Decodable, Equatable { let x: Int; let y: Int }
        let value: JSONValue = .object(["x": .int(3), "y": .int(4)])
        let point = try value.decode(Point.self)
        XCTAssertEqual(point, Point(x: 3, y: 4))
    }

    func testJsStringLiteralEscaping() {
        let literal = BridgeHost.jsStringLiteral(#"{"a":"b\"c"}"#)
        // Should be a valid JSON string token that decodes back to the original.
        let data = literal.data(using: .utf8)!
        let decoded = try? JSONDecoder().decode(String.self, from: data)
        XCTAssertEqual(decoded, #"{"a":"b\"c"}"#)
    }
}

final class BridgeErrorTests: XCTestCase {
    func testConstructorSetsErrorType() {
        let error = BridgeError(.rejected, "test")
        XCTAssertEqual(error.errorType, .rejected)
        XCTAssertEqual(error.message, "test")
    }

    func testDefaultMessageIsErrorTypeRawValue() {
        let error = BridgeError(.bridgeNotAvailable)
        XCTAssertEqual(error.message, "BRIDGE_NOT_AVAILABLE")
    }
}

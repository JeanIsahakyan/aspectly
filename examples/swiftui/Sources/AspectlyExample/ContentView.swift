import SwiftUI
import Foundation
import AspectlyBridge
import AspectlyBridgeWebKit

// MARK: - DTOs (mirror the .NET example records)

struct EchoParams: Decodable { let message: String }
struct AddParams: Decodable { let a: Int; let b: Int }
struct SystemInfo: Encodable {
    let machineName: String
    let osVersion: String
    let processId: Int
}

struct GreetParams: Encodable { let name: String }
struct GreetResult: Decodable { let message: String }
struct TimeResult: Decodable { let time: String }
struct CalcParams: Encodable { let a: Int; let b: Int }
struct CalcResult: Decodable { let sum: Int; let product: Int }

// MARK: - View

struct ContentView: View {
    @StateObject private var model = ContentView.makeModel()
    @State private var log: [String] = []
    @State private var handlersRegistered = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Circle()
                    .fill(model.isInitialized ? Color.green : Color.red)
                    .frame(width: 12, height: 12)
                Text(model.isInitialized ? "Connected to JS" : "Waiting for JS…")
                    .font(.headline)
            }

            HStack {
                Button("greet") { call { try await callGreet() } }
                Button("getTime") { call { try await callGetTime() } }
                Button("calculate") { call { try await callCalculate() } }
                Button("Clear log") { log.removeAll() }
            }
            .disabled(!model.isInitialized)

            ScrollView {
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(Array(log.enumerated()), id: \.offset) { _, line in
                        Text(line).font(.system(.caption, design: .monospaced))
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(height: 160)

            AspectlyWebView(model: model)
                .frame(minWidth: 480, minHeight: 360)
        }
        .padding()
        .onChange(of: model.isLoaded) { loaded in
            guard loaded, !handlersRegistered else { return }
            handlersRegistered = true
            registerHandlersAndInitialize()
        }
    }

    // MARK: - Native handlers JS can call

    private func registerHandlersAndInitialize() {
        // ping -> "pong"
        model.bridge.registerHandler("ping") { _ -> String in
            append("[Handler] ping -> pong")
            return "pong"
        }
        // echo(EchoParams) -> message
        model.bridge.registerHandler("echo") { (p: EchoParams) -> String in
            append("[Handler] echo -> \(p.message)")
            return p.message
        }
        // add(AddParams) -> Int
        model.bridge.registerHandler("add") { (p: AddParams) -> Int in
            let result = p.a + p.b
            append("[Handler] add(\(p.a), \(p.b)) -> \(result)")
            return result
        }
        // getSystemInfo -> SystemInfo
        model.bridge.registerHandler("getSystemInfo") { _ -> SystemInfo in
            let info = SystemInfo(
                machineName: ProcessInfo.processInfo.hostName,
                osVersion: ProcessInfo.processInfo.operatingSystemVersionString,
                processId: Int(ProcessInfo.processInfo.processIdentifier)
            )
            append("[Handler] getSystemInfo -> \(info.machineName)")
            return info
        }

        Task {
            do {
                try await model.bridge.initialize()
                append("Bridge initialized!")
                append("JS methods: \(model.bridge.supportedMethods.joined(separator: ", "))")
                append("Swift methods: \(model.bridge.registeredMethods.joined(separator: ", "))")
            } catch {
                append("Bridge init error: \(error)")
            }
        }
    }

    // MARK: - Calling JS methods

    private func callGreet() async throws {
        append("[Call] greet({ name: \"Swift\" })")
        let result: GreetResult = try await model.bridge.send("greet", params: GreetParams(name: "Swift"))
        append("[Result] \(result.message)")
    }

    private func callGetTime() async throws {
        append("[Call] getTime()")
        let result: TimeResult = try await model.bridge.send("getTime")
        append("[Result] \(result.time)")
    }

    private func callCalculate() async throws {
        append("[Call] calculate({ a: 5, b: 3 })")
        let result: CalcResult = try await model.bridge.send("calculate", params: CalcParams(a: 5, b: 3))
        append("[Result] sum=\(result.sum), product=\(result.product)")
    }

    // MARK: - Helpers

    private func call(_ work: @escaping () async throws -> Void) {
        Task {
            do { try await work() }
            catch { append("[Error] \(error)") }
        }
    }

    private func append(_ message: String) {
        Task { @MainActor in log.append(message) }
    }

    private static func makeModel() -> AspectlyWebViewModel {
        guard let url = Bundle.module.url(forResource: "index", withExtension: "html", subdirectory: "web") else {
            fatalError("index.html not found in bundle resources")
        }
        return AspectlyWebViewModel(url: url)
    }
}

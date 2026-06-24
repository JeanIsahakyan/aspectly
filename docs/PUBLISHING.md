# Publishing

Aspectly ships to seven package registries. Everything is automated by
[`.github/workflows/release.yml`](../.github/workflows/release.yml), which runs
when you publish a GitHub Release (tag `vX.Y.Z`). You can also publish each
ecosystem manually with the commands below.

## Overview

| Ecosystem | Packages | Registry | Auth |
|-----------|----------|----------|------|
| npm | `@aspectly/core`, `@aspectly/web`, `@aspectly/react-native`, `@aspectly/react-native-web`, `@aspectly/transports` | npmjs.com | npm provenance (OIDC) |
| NuGet | `Aspectly.Bridge`, `Aspectly.Bridge.CefSharp`, `Aspectly.Bridge.WebView2` | nuget.org | `NUGET_API_KEY` |
| Swift Package Manager | `AspectlyBridge`, `AspectlyBridgeWebKit` | the git tag itself | none (just tag) |
| CocoaPods | `AspectlyBridge`, `AspectlyBridgeWebKit` | CocoaPods trunk | `COCOAPODS_TRUNK_TOKEN` |
| Maven | `com.aspectly:aspectly-bridge`, `com.aspectly:aspectly-bridge-webview` | Maven Central (+ GitHub Packages) | `OSSRH_*`, `SIGNING_*` |
| pub.dev (Dart/Flutter) | `aspectly_bridge` | pub.dev | OIDC / `pub token` |
| PyPI (Python) | `aspectly-bridge` | PyPI | `PYPI_API_TOKEN` (or Trusted Publishing) |

## Required GitHub secrets

| Secret | Used for |
|--------|----------|
| `NUGET_API_KEY` | NuGet push |
| `OSSRH_USERNAME` / `OSSRH_PASSWORD` | Sonatype OSSRH (Maven Central) user token |
| `SIGNING_KEY` | ASCII-armored GPG **private** key (for Maven Central signing) |
| `SIGNING_PASSWORD` | passphrase for the GPG key |
| `COCOAPODS_TRUNK_TOKEN` | CocoaPods trunk session token (`pod trunk register`) |

npm uses [trusted publishing / provenance](https://docs.npmjs.com/generating-provenance-statements)
via the workflow's `id-token: write` permission — no `NPM_TOKEN` needed if the
repo is registered as a trusted publisher (otherwise add `NODE_AUTH_TOKEN`).

## Per-ecosystem details

### npm (JS / TypeScript)
Versioned with [Changesets](https://github.com/changesets/changesets).

```bash
pnpm changeset          # describe the change
pnpm version            # bump versions + update changelogs
pnpm build && pnpm -r publish --provenance --access public
```

### Swift Package Manager (iOS / macOS / visionOS)
SwiftPM consumes the package **directly from the git tag** — there is no
registry. The manifest is at the repo root (`Package.swift`). To "publish",
just create the release tag `vX.Y.Z`. Consumers add:

```swift
.package(url: "https://github.com/JeanIsahakyan/aspectly.git", from: "2.1.0")
```

### CocoaPods (iOS / macOS / visionOS)
The podspecs are at the repo root. After the tag exists:

```bash
pod trunk push AspectlyBridge.podspec --allow-warnings --synchronous
pod trunk push AspectlyBridgeWebKit.podspec --allow-warnings
```

`AspectlyBridgeWebKit` depends on `AspectlyBridge`, so push the core first.
Update `s.version` in both podspecs (and the `s.dependency` in the WebKit
podspec) to match the tag — the release workflow does this automatically.

### Maven Central (Android / Kotlin)
The Gradle modules under `android/` are configured with `maven-publish` +
`signing`. Validate locally first:

```bash
cd android
gradle publishToMavenLocal -PreleaseVersion=2.1.0
```

Publish to Maven Central (Sonatype OSSRH) — requires the `OSSRH_*` and
`SIGNING_*` credentials:

```bash
cd android
gradle publishAllPublicationsToOSSRHRepository -PreleaseVersion=2.1.0 \
  -PossrhUsername=… -PossrhPassword=… \
  -PsigningKey="$(cat key.asc)" -PsigningPassword=…
```

GitHub Packages is also configured (repository name `GitHubPackages`); publish
with `gradle publishAllPublicationsToGitHubPackagesRepository` and a
`GITHUB_TOKEN`.

> After OSSRH upload, complete the release in the Sonatype UI (or via the
> Nexus staging plugin) — Central requires the staging repository to be closed
> and released.

### NuGet (.NET)
```bash
dotnet pack dotnet/Aspectly.Bridge/Aspectly.Bridge.csproj -c Release /p:Version=2.1.0 -o nupkgs
dotnet nuget push nupkgs/*.nupkg --api-key "$NUGET_API_KEY" --source https://api.nuget.org/v3/index.json
```

### pub.dev (Dart / Flutter)
The package is pure Dart at `dart/`. Test, then publish:

```bash
cd dart
dart pub get && dart test
dart pub publish            # interactive; or use pub.dev automated publishing (OIDC tag trigger)
```

### PyPI (Python)
The package is at `python/`. Build and upload:

```bash
cd python
python -m pytest                       # core tests (no GTK needed)
python -m build                        # produces dist/*.whl and *.tar.gz
python -m twine upload dist/*          # uses ~/.pypirc or TWINE_* / PYPI_API_TOKEN
```

Prefer [Trusted Publishing](https://docs.pypi.org/trusted-publishers/) (OIDC) in
CI over a long-lived `PYPI_API_TOKEN`.

## Versioning

The native packages (Swift, Android) track the JS line and are at **2.1.0**
(the release that introduced them). The .NET packages version independently.
Bump:
- npm: `pnpm version` (Changesets)
- Swift: the git tag + `s.version` in the two podspecs
- Android: `android/build.gradle.kts` (`version`) or `-PreleaseVersion`
- .NET: `<Version>` in each `.csproj` (or `/p:Version`)

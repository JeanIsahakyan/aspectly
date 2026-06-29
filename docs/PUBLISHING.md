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
| Maven | `io.github.jeanisahakyan:aspectly-bridge`, `io.github.jeanisahakyan:aspectly-bridge-webview` | Maven Central (+ GitHub Packages) | `OSSRH_*`, `SIGNING_*` |
| pub.dev (Dart/Flutter) | `aspectly_bridge` | pub.dev | OIDC trusted publisher (no secret) |
| PyPI (Python) | `aspectly-bridge` | PyPI | OIDC trusted publisher (no secret) |

## Required GitHub secrets

| Secret | Used for |
|--------|----------|
| `NUGET_API_KEY` | NuGet push |
| `OSSRH_USERNAME` / `OSSRH_PASSWORD` | Sonatype OSSRH (Maven Central) user token |
| `SIGNING_KEY` | ASCII-armored GPG **private** key (for Maven Central signing) |
| `SIGNING_PASSWORD` | passphrase for the GPG key |
| `COCOAPODS_TRUNK_TOKEN` | CocoaPods trunk session token (`pod trunk register`) |

**No secret needed (OIDC):** npm, PyPI, and pub.dev all publish via OpenID
Connect trusted publishing using the workflow's `id-token: write` permission —
no long-lived tokens. Each requires a **one-time** trusted-publisher setup on
the registry side (see the per-ecosystem sections):

- **npm** — register the repo as a [trusted publisher](https://docs.npmjs.com/generating-provenance-statements) (otherwise add `NODE_AUTH_TOKEN`).
- **PyPI** — add a [Trusted Publisher](https://docs.pypi.org/trusted-publishers/) for `aspectly-bridge` (otherwise add `PYPI_API_TOKEN`).
- **pub.dev** — enable [Automated publishing](https://dart.dev/tools/pub/automated-publishing) for `aspectly_bridge`.

Swift Package Manager needs nothing (consumed from the git tag). `GITHUB_TOKEN`
is provided automatically by Actions.

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
Group ID **`io.github.jeanisahakyan`** (artifacts `aspectly-bridge`,
`aspectly-bridge-webview`). The Gradle modules under `android/` use
`maven-publish` + `signing`.

> **Legacy OSSRH (`s01.oss.sonatype.org`) was sunset on 2025-06-30.** Publishing
> now goes through the **Central Portal** via its **OSSRH Staging API**
> compatibility service. The Gradle repo URL points at
> `https://ossrh-staging-api.central.sonatype.com`.

**One-time setup:**
1. Register the namespace at https://central.sonatype.com/publishing/namespaces —
   `io.github.jeanisahakyan` is verified by creating the GitHub repo Sonatype names.
2. Generate a **Portal user token** at https://central.sonatype.com/account →
   *Generate User Token* → use as `OSSRH_USERNAME` / `OSSRH_PASSWORD`.

The release workflow then (a) stages with
`publishAllPublicationsToOSSRHRepository`, then (b) finalizes + auto-releases by
`POST`ing to the staging API's `manual/upload/defaultRepository/io.github.jeanisahakyan?publishing_type=automatic`.

Validate locally first (no remote upload):

```bash
cd android
gradle publishToMavenLocal -PreleaseVersion=2.1.0
```

GitHub Packages is also configured (repository name `GitHubPackages`); publish
with `gradle publishAllPublicationsToGitHubPackagesRepository` and a
`GITHUB_TOKEN`.

### NuGet (.NET)
```bash
dotnet pack dotnet/Aspectly.Bridge/Aspectly.Bridge.csproj -c Release /p:Version=2.1.0 -o nupkgs
dotnet nuget push nupkgs/*.nupkg --api-key "$NUGET_API_KEY" --source https://api.nuget.org/v3/index.json
```

### pub.dev (Dart / Flutter)
The package is pure Dart at `dart/`. **CI publishes it automatically** via the
`publish-pub-dev` job in `release.yml` using OIDC (no secret).

**One-time setup** (pub.dev side): open the `aspectly_bridge` package →
**Admin → Automated publishing → Enable publishing from GitHub Actions**, set
repository `JeanIsahakyan/aspectly` and tag pattern `v{{version}}`. The
`release.yml` job then `dart pub publish`es with a short-lived OIDC token; the
release tag `vX.Y.Z` matches the pattern.

Manual / local publish (fallback):

```bash
cd dart
dart pub get && dart test
dart pub publish            # interactive
```

### PyPI (Python)
The package is at `python/`. **CI publishes it automatically** via the
`publish-pypi` job in `release.yml`, which builds the sdist/wheel and uploads
with `pypa/gh-action-pypi-publish` using OIDC (no secret).

**One-time setup** (PyPI side): on pypi.org go to the `aspectly-bridge` project →
**Publishing → Add a new trusted publisher (GitHub)** with owner `JeanIsahakyan`,
repository `aspectly`, and workflow `release.yml`. (For the very first release,
PyPI also supports a "pending" trusted publisher so you can register it before
the project exists.)

Manual / local publish (fallback):

```bash
cd python
python -m pytest                       # core tests (no GTK needed)
python -m build                        # produces dist/*.whl and *.tar.gz
python -m twine upload dist/*          # uses ~/.pypirc or TWINE_* / PYPI_API_TOKEN
```

## Versioning

The native packages (Swift, Android) track the JS line and are at **2.1.0**
(the release that introduced them). The .NET packages version independently.
Bump:
- npm: `pnpm version` (Changesets)
- Swift: the git tag + `s.version` in the two podspecs
- Android: `android/build.gradle.kts` (`version`) or `-PreleaseVersion`
- .NET: `<Version>` in each `.csproj` (or `/p:Version`)

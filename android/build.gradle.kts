import org.gradle.api.publish.PublishingExtension

plugins {
    id("com.android.library") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
    id("org.jetbrains.kotlin.jvm") version "1.9.24" apply false
}

allprojects {
    group = "io.github.jeanisahakyan"
    // Overridable from CI: `gradle publish -PreleaseVersion=2.1.0`
    version = (findProperty("releaseVersion") as String?) ?: "2.1.0"
}

// Shared publish repositories for any module that applies `maven-publish`.
// Credentials come from gradle properties or environment variables, so local
// builds work and CI can supply secrets.
subprojects {
    plugins.withId("maven-publish") {
        configure<PublishingExtension> {
            repositories {
                maven {
                    name = "GitHubPackages"
                    url = uri("https://maven.pkg.github.com/JeanIsahakyan/aspectly")
                    credentials {
                        username = (findProperty("gpr.user") as String?) ?: System.getenv("GITHUB_ACTOR")
                        password = (findProperty("gpr.token") as String?) ?: System.getenv("GITHUB_TOKEN")
                    }
                }
                maven {
                    // Central Portal via the OSSRH Staging API compatibility service
                    // (legacy s01.oss.sonatype.org was sunset on 2025-06-30). Credentials
                    // are a Central Portal user token (central.sonatype.com -> Generate User Token).
                    name = "OSSRH"
                    val releasesUrl = uri("https://ossrh-staging-api.central.sonatype.com/service/local/staging/deploy/maven2/")
                    val snapshotsUrl = uri("https://central.sonatype.com/repository/maven-snapshots/")
                    url = if (version.toString().endsWith("SNAPSHOT")) snapshotsUrl else releasesUrl
                    credentials {
                        username = (findProperty("ossrhUsername") as String?) ?: System.getenv("OSSRH_USERNAME")
                        password = (findProperty("ossrhPassword") as String?) ?: System.getenv("OSSRH_PASSWORD")
                    }
                }
            }
        }
    }
}

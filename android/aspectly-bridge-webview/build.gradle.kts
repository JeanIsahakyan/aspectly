import org.gradle.api.publish.maven.MavenPublication

plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    `maven-publish`
    signing
}

android {
    namespace = "com.aspectly.bridge.webview"
    compileSdk = 34

    defaultConfig {
        minSdk = 21
        consumerProguardFiles("consumer-rules.pro")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
            withJavadocJar()
        }
    }
}

dependencies {
    api(project(":aspectly-bridge"))
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}

afterEvaluate {
    publishing {
        publications {
            create<MavenPublication>("release") {
                from(components["release"])
                artifactId = "aspectly-bridge-webview"
                pom {
                    name.set("Aspectly Bridge WebView")
                    description.set(
                        "Android WebView browser bridge for Aspectly — bidirectional " +
                            "communication with JavaScript running in an Android WebView."
                    )
                    url.set("https://github.com/JeanIsahakyan/aspectly")
                    licenses {
                        license {
                            name.set("MIT")
                            url.set("https://opensource.org/licenses/MIT")
                        }
                    }
                    developers {
                        developer {
                            id.set("JeanIsahakyan")
                            name.set("Zhan Isaakian")
                            email.set("jeanisahakyan@gmail.com")
                        }
                    }
                    scm {
                        url.set("https://github.com/JeanIsahakyan/aspectly")
                        connection.set("scm:git:https://github.com/JeanIsahakyan/aspectly.git")
                        developerConnection.set("scm:git:ssh://git@github.com/JeanIsahakyan/aspectly.git")
                    }
                }
            }
        }
    }

    signing {
        val signingKey = System.getenv("SIGNING_KEY") ?: (findProperty("signingKey") as String?)
        val signingPassword = System.getenv("SIGNING_PASSWORD") ?: (findProperty("signingPassword") as String?)
        if (!signingKey.isNullOrBlank()) {
            useInMemoryPgpKeys(signingKey, signingPassword)
            sign(publishing.publications["release"])
        }
    }
}

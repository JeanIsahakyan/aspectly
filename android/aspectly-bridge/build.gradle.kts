import org.gradle.api.publish.maven.MavenPublication
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.jetbrains.kotlin.jvm")
    `java-library`
    `maven-publish`
    signing
}

java {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
    withSourcesJar()
    withJavadocJar()
}

tasks.withType<KotlinCompile>().configureEach {
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    api("com.google.code.gson:gson:2.10.1")
    api("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("junit:junit:4.13.2")
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            artifactId = "aspectly-bridge"
            pom {
                name.set("Aspectly Bridge")
                description.set(
                    "Core Aspectly bridge for Android/Kotlin — type-safe, bidirectional " +
                        "communication between native code and JavaScript via the Aspectly protocol."
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
                        email.set("jeanisahkyan@gmail.com")
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
        sign(publishing.publications["maven"])
    }
}

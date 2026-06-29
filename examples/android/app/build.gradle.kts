plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.aspectly.example"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.aspectly.example"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    // Resolved from the included build (../../android) via composite build.
    implementation("io.github.jeanisahakyan:aspectly-bridge-webview")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}

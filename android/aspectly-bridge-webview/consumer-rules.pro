# Keep the @JavascriptInterface method so the WebView JS bridge keeps working
# after R8/ProGuard shrinking.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

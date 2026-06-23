Pod::Spec.new do |s|
  s.name             = 'AspectlyBridgeWebKit'
  s.version          = '2.1.0'
  s.summary          = 'WKWebView browser bridge + SwiftUI integration for Aspectly.'
  s.description      = <<-DESC
  WKWebView browser bridge and SwiftUI integration for Aspectly. Provides
  WKWebViewBrowserBridge (the IBrowserBridge equivalent for WKWebView) and the
  AspectlyWebView / AspectlyWebViewModel SwiftUI components for iOS, macOS, and
  visionOS.
                       DESC
  s.homepage         = 'https://github.com/JeanIsahakyan/aspectly'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'Zhan Isaakian' => 'jeanisahkyan@gmail.com' }
  s.source           = { :git => 'https://github.com/JeanIsahakyan/aspectly.git', :tag => "v#{s.version}" }

  s.swift_versions   = ['5.9']
  s.ios.deployment_target     = '14.0'
  s.osx.deployment_target     = '11.0'
  s.visionos.deployment_target = '1.0'

  s.source_files     = 'swift/Sources/AspectlyBridgeWebKit/**/*.swift'
  s.dependency 'AspectlyBridge', '2.1.0'
  s.frameworks       = 'WebKit', 'SwiftUI'
end

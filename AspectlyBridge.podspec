Pod::Spec.new do |s|
  s.name             = 'AspectlyBridge'
  s.version          = '2.1.0'
  s.summary          = 'Type-safe bridge between native Swift and JavaScript in a WKWebView.'
  s.description      = <<-DESC
  Aspectly is a bidirectional, type-safe communication bridge between native
  Swift code and JavaScript running in a WKWebView. AspectlyBridge is the core
  library (Foundation only, no WebKit dependency). It speaks the same wire
  protocol as the Aspectly React Native, Web, and .NET bridges, so the same
  embedded web content works unchanged across every host.
                       DESC
  s.homepage         = 'https://github.com/JeanIsahakyan/aspectly'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'Zhan Isaakian' => 'jeanisahkyan@gmail.com' }
  s.source           = { :git => 'https://github.com/JeanIsahakyan/aspectly.git', :tag => "v#{s.version}" }

  s.swift_versions   = ['5.9']
  s.ios.deployment_target     = '14.0'
  s.osx.deployment_target     = '11.0'
  s.visionos.deployment_target = '1.0'

  s.source_files     = 'swift/Sources/AspectlyBridge/**/*.swift'
end

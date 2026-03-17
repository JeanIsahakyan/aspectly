import {
  Navbar,
  Hero,
  Features,
  Installation,
  Examples,
  LiveDemo,
  LiveDemoWindow,
  Docs,
  Changelog,
  Footer,
} from './components/sections'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <LiveDemo />
        <LiveDemoWindow />
        <Installation />
        <Examples />
        <Docs />
        <Changelog />
      </main>
      <Footer />
    </div>
  )
}

export default App

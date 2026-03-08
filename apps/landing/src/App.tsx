import {
  Navbar,
  Hero,
  Features,
  Installation,
  Examples,
  LiveDemo,
  LiveDemoWindow,
  ApiDocs,
  Architecture,
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
        <ApiDocs />
        <Architecture />
      </main>
      <Footer />
    </div>
  )
}

export default App

import {
  Navbar,
  Hero,
  Features,
  Installation,
  LiveDemo,
  Docs,
  Changelog,
  Footer,
} from './components/sections'

function App() {
  return (
    <div className="grain min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <LiveDemo />
        <Features />
        <Installation />
        <Docs />
        <Changelog />
      </main>
      <Footer />
    </div>
  )
}

export default App

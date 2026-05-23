import './index.css'
import ConfigPanel from './components/ConfigPanel'
import FeatureInput from './components/FeatureInput'
import StackDiagram from './components/StackDiagram'
import GraphCanvas from './components/GraphCanvas'
import NodeDetail from './components/NodeDetail'
import ExportPanel from './components/ExportPanel'

export default function App() {
  return (
    <div className="min-h-screen bg-canvas-soft">
      <nav className="bg-canvas sticky top-0 z-20 px-6 py-4 flex items-center justify-between border-b border-canvas-soft">
        <div>
          <span className="text-base font-black text-ink">FAM</span>
          <span className="text-xs text-mute ml-2 hidden sm:inline">Feature Architecture Map</span>
        </div>
        <span className="text-xs text-mute italic">Plan the blueprint. Then build.</span>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-5xl font-black text-ink leading-none mb-2">Feature Architecture Map</h1>
          <p className="text-base text-body">Transform a feature list into a structured visual architecture.</p>
        </div>

        <ConfigPanel />
        <FeatureInput />
        <StackDiagram />
        <GraphCanvas />
        <NodeDetail />
        <ExportPanel />
      </main>

      <footer className="bg-ink text-canvas-soft text-sm px-6 py-8 mt-12 text-center">
        <p className="font-semibold">Nama Digital</p>
        <p className="text-mute mt-1">Plan the blueprint. Then build.</p>
      </footer>
    </div>
  )
}

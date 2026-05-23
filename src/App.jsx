import { useEffect } from 'react'
import './index.css'
import { useAppStore } from './store/useAppStore'
import ConfigPanel from './components/ConfigPanel'
import FeatureInput from './components/FeatureInput'
import StackDiagram from './components/StackDiagram'
import GraphCanvas from './components/GraphCanvas'
import NodeDetail from './components/NodeDetail'
import EdgeHandoff from './components/EdgeHandoff'
import AiResponsePanel from './components/AiResponsePanel'
import ExportPanel from './components/ExportPanel'

export default function App() {
  const darkMode = useAppStore((s) => s.darkMode)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  return (
    <div className="min-h-screen bg-canvas-soft dark:bg-zinc-900 transition-colors">
      <nav className="bg-canvas dark:bg-zinc-800 sticky top-0 z-20 px-6 py-4 flex items-center justify-between border-b border-canvas-soft dark:border-zinc-700">
        <div>
          <span className="text-base font-black text-ink dark:text-primary">FAM</span>
          <span className="text-xs text-mute ml-2 hidden sm:inline dark:text-zinc-400">Feature Architecture Map</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-mute italic hidden sm:inline dark:text-zinc-400">Plan the blueprint. Then build.</span>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-canvas-soft dark:bg-zinc-700 text-ink dark:text-primary hover:bg-primary-pale dark:hover:bg-zinc-600 transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀' : '🌙'}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-5xl font-black text-ink dark:text-white leading-none mb-2">Feature Architecture Map</h1>
          <p className="text-base text-body dark:text-zinc-400">Transform a feature list into a structured visual architecture.</p>
        </div>

        <ConfigPanel />
        <FeatureInput />
        <StackDiagram />
        <GraphCanvas />
        <AiResponsePanel />
        <NodeDetail />
        <EdgeHandoff />
        <ExportPanel />
      </main>

      <footer className="bg-ink dark:bg-zinc-950 text-canvas-soft text-sm px-6 py-8 mt-12 text-center">
        <p className="font-semibold">Nama Digital</p>
        <p className="text-mute mt-1">Plan the blueprint. Then build.</p>
      </footer>
    </div>
  )
}

import { useAppStore } from '../store/useAppStore'
import { toJSON, toMarkdown, toScaffold, toPrompts, toBlueprint } from '../lib/exporters'

const EXPORTS = [
  { label: 'Export JSON', fn: toJSON },
  { label: 'Export Markdown', fn: toMarkdown },
  { label: 'Export Scaffold', fn: toScaffold },
  { label: 'Export Agent Prompts', fn: toPrompts },
  { label: '📦 Export Blueprint', fn: toBlueprint },
]

export default function ExportPanel() {
  const graph = useAppStore((s) => s.graph)
  if (!graph) return null

  return (
    <div className="bg-canvas dark:bg-zinc-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-black text-ink dark:text-white mb-4">Export</h2>
      <div className="flex flex-wrap gap-3">
        {EXPORTS.map(({ label, fn }) => (
          <button
            key={label}
            onClick={() => fn(graph)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-canvas-soft dark:bg-zinc-700 text-ink dark:text-zinc-300 border border-mute dark:border-zinc-600 hover:bg-primary-pale hover:border-primary dark:hover:bg-zinc-600 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

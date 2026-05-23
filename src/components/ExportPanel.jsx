import { useAppStore } from '../store/useAppStore'
import { toJSON, toMarkdown, toScaffold, toPrompts } from '../lib/exporters'

const EXPORTS = [
  { label: 'Export JSON', fn: toJSON },
  { label: 'Export Markdown', fn: toMarkdown },
  { label: 'Export Scaffold', fn: toScaffold },
  { label: 'Export Agent Prompts', fn: toPrompts },
]

export default function ExportPanel() {
  const graph = useAppStore((s) => s.graph)
  if (!graph) return null

  return (
    <div className="bg-canvas rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-black text-ink mb-4">Export</h2>
      <div className="flex flex-wrap gap-3">
        {EXPORTS.map(({ label, fn }) => (
          <button
            key={label}
            onClick={() => fn(graph)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-canvas-soft text-ink border border-mute hover:bg-primary-pale hover:border-primary transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

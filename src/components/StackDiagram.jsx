import { useAppStore } from '../store/useAppStore'

const LAYER_KEYWORDS = {
  Frontend: ['ui', 'dashboard', 'portal', 'frontend', 'page', 'view', 'screen', 'form', 'modal'],
  Backend: ['api', 'service', 'controller', 'handler', 'auth', 'queue', 'job', 'worker', 'webhook'],
  Database: ['database', 'db', 'storage', 'cache', 'redis', 'sql', 'mongo', 'repository'],
  Integration: ['salesforce', 'stripe', 'payment', 'email', 'sms', 'graphql', 'rest', 'webhook'],
}

function inferLayers(nodes) {
  const found = new Set()
  for (const node of nodes) {
    const text = (node.label + ' ' + node.pattern + ' ' + node.dataFlow).toLowerCase()
    for (const [layer, keywords] of Object.entries(LAYER_KEYWORDS)) {
      if (keywords.some((kw) => text.includes(kw))) found.add(layer)
    }
  }
  return [...found]
}

export default function StackDiagram() {
  const graph = useAppStore((s) => s.graph)
  if (!graph) return null

  const layers = inferLayers(graph.nodes)

  return (
    <div className="bg-canvas-soft dark:bg-zinc-800 rounded-xl p-6">
      <h2 className="text-xl font-black text-ink dark:text-white mb-4">Inferred Stack</h2>
      <div className="flex flex-wrap gap-3">
        {layers.map((layer) => (
          <span
            key={layer}
            className="px-3 py-1 rounded-pill text-sm font-semibold bg-primary-pale text-positive-deep"
          >
            {layer}
          </span>
        ))}
        {layers.length === 0 && (
          <span className="text-sm text-mute">No stack layers inferred.</span>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { computeBuildOrder } from '../lib/buildOrder'

const RISK_STYLES = {
  low:    'bg-primary-pale text-positive-deep',
  medium: 'bg-warning text-warning-content',
  high:   'bg-negative-bg text-canvas',
}

const RISK_LABEL = { low: 'Low', medium: 'Med', high: 'High' }

export default function BuildOrder() {
  const graph = useAppStore((s) => s.graph)
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId)
  const [open, setOpen] = useState(false)

  if (!graph) return null

  const result = computeBuildOrder(graph)
  if (!result) return null

  const { phases, criticalSet, criticalDays, totalDays } = result

  let globalStep = 1

  return (
    <div className="bg-canvas dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-canvas-soft dark:hover:bg-zinc-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-ink dark:text-white">Build Order</h2>
          <span className="text-xs font-semibold text-mute dark:text-zinc-400 bg-canvas-soft dark:bg-zinc-700 px-2 py-0.5 rounded-pill">
            {graph.nodes.length} nodes · ~{totalDays}d total
          </span>
          <span className="text-xs font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-pill">
            Critical path: ~{criticalDays}d
          </span>
        </div>
        <span className="text-mute text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6">
          {/* critical path legend */}
          <div className="flex items-center gap-2 text-xs text-mute dark:text-zinc-400">
            <span className="inline-block w-3 h-3 rounded-full bg-warning shrink-0" />
            Critical path — longest dependency chain. Delays here delay everything.
          </div>

          {phases.map(({ phase, items }) => (
            <div key={phase}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-black text-mute uppercase tracking-widest">Phase {phase}</span>
                <div className="flex-1 h-px bg-mute dark:bg-zinc-700" />
                <span className="text-xs text-mute">{items.length} node{items.length > 1 ? 's' : ''} · can build in parallel</span>
              </div>

              <div className="space-y-2">
                {items.map(({ node, effort, blocksCount }) => {
                  const step = globalStep++
                  const isCritical = criticalSet.has(node.id)
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:bg-primary-pale dark:hover:bg-zinc-700 ${
                        isCritical
                          ? 'border-warning bg-warning/5 dark:bg-warning/10'
                          : 'border-mute dark:border-zinc-600 bg-canvas dark:bg-zinc-900'
                      }`}
                    >
                      {/* step number */}
                      <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                        isCritical ? 'bg-warning text-ink' : 'bg-canvas-soft dark:bg-zinc-700 text-mute'
                      }`}>
                        {step}
                      </span>

                      {/* label + pattern */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-ink dark:text-white truncate">{node.label}</p>
                          {isCritical && (
                            <span className="text-xs font-semibold text-warning">⚡ critical</span>
                          )}
                        </div>
                        <p className="text-xs text-mute dark:text-zinc-500 truncate">{node.pattern}</p>
                      </div>

                      {/* meta chips */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-pill text-xs font-bold ${RISK_STYLES[node.riskLevel]}`}>
                          {RISK_LABEL[node.riskLevel]}
                        </span>
                        <span className="text-xs text-mute dark:text-zinc-400 font-mono">~{effort}d</span>
                        {blocksCount > 0 && (
                          <span className="text-xs text-mute dark:text-zinc-500">
                            blocks {blocksCount}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <p className="text-xs text-mute dark:text-zinc-500 pt-2">
            Click any node to open its details. Nodes in the same phase have no mutual dependencies — safe to build in parallel.
          </p>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const TABS = ['Dev', 'EA', 'SA']

const RISK_STYLES = {
  low: 'bg-primary-pale text-positive-deep',
  medium: 'bg-warning text-warning-content',
  high: 'bg-negative-bg text-canvas',
}

export default function NodeDetail() {
  const graph = useAppStore((s) => s.graph)
  const selectedNodeId = useAppStore((s) => s.selectedNodeId)
  const [activeTab, setActiveTab] = useState('Dev')
  const [copied, setCopied] = useState(false)

  if (!graph || !selectedNodeId) return null

  const node = graph.nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  function copyPrompt() {
    navigator.clipboard.writeText(node.agentPrompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-canvas-soft dark:bg-zinc-800 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-ink dark:text-white">{node.label}</h2>
          <p className="text-sm text-body dark:text-zinc-400 mt-1">{node.pattern}</p>
        </div>
        <span className={`px-3 py-1 rounded-pill text-sm font-semibold shrink-0 ${RISK_STYLES[node.riskLevel]}`}>
          {node.riskLevel} risk
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-primary text-on-primary'
                : 'bg-canvas dark:bg-zinc-700 text-ink dark:text-zinc-300 hover:bg-primary-pale dark:hover:bg-zinc-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Dev' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Data Flow</p>
            <p className="text-sm text-body dark:text-zinc-300">{node.dataFlow}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Folder Structure</p>
            <pre className="text-xs bg-canvas dark:bg-zinc-900 border border-mute dark:border-zinc-700 rounded-xl p-3 overflow-x-auto text-ink dark:text-zinc-300 font-mono">
              {node.folderStructure}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-mute uppercase tracking-wide">Agent Prompt</p>
              <button
                onClick={copyPrompt}
                className="text-xs font-semibold px-3 py-1 rounded-pill bg-primary text-on-primary hover:bg-primary-active transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs bg-canvas dark:bg-zinc-900 border border-mute dark:border-zinc-700 rounded-xl p-3 overflow-x-auto text-ink dark:text-zinc-300 font-mono whitespace-pre-wrap">
              {node.agentPrompt}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'EA' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-2">NFR Tags</p>
            <div className="flex flex-wrap gap-2">
              {node.nfrTags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-pill text-sm font-semibold bg-primary-pale text-positive-deep">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Dependencies</p>
            {node.dependencies.length > 0 ? (
              <ul className="text-sm text-body dark:text-zinc-300 space-y-1 list-disc list-inside">
                {node.dependencies.map((dep) => <li key={dep}>{dep}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-mute">No dependencies.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'SA' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Business Reason</p>
            <p className="text-sm text-body dark:text-zinc-300">{node.businessReason}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Effort Estimate</p>
            <p className="text-sm text-body dark:text-zinc-300">{node.effortEstimate}</p>
          </div>
        </div>
      )}
    </div>
  )
}

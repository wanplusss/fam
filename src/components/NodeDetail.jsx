import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { reviewNode, fixNode } from '../lib/deepseek'

const TABS = ['Dev', 'EA', 'SA', 'Review']

const RISK_STYLES = {
  low: 'bg-primary-pale text-positive-deep',
  medium: 'bg-warning text-warning-content',
  high: 'bg-negative-bg text-canvas',
}

export default function NodeDetail() {
  const graph = useAppStore((s) => s.graph)
  const selectedNodeId = useAppStore((s) => s.selectedNodeId)
  const config = useAppStore((s) => s.config)
  const nodeReviews = useAppStore((s) => s.nodeReviews)
  const setNodeReview = useAppStore((s) => s.setNodeReview)
  const patchNode = useAppStore((s) => s.patchNode)
  const [activeTab, setActiveTab] = useState('Dev')
  const [copied, setCopied] = useState(false)

  if (!graph || !selectedNodeId) return null

  const node = graph.nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  const reviewState = nodeReviews[node.id] ?? {}

  function copyPrompt() {
    navigator.clipboard.writeText(node.agentPrompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleReview() {
    setNodeReview(node.id, { loading: true, error: null })
    setActiveTab('Review')
    try {
      const review = await reviewNode({
        apiKey: config.apiKey,
        model: config.model,
        node,
        allNodes: graph.nodes,
      })
      setNodeReview(node.id, { loading: false, review })
    } catch (err) {
      setNodeReview(node.id, { loading: false, error: err.message })
    }
  }

  async function handleFix() {
    if (!reviewState.review) return
    setNodeReview(node.id, { fixing: true, fixError: null })
    try {
      const fixed = await fixNode({
        apiKey: config.apiKey,
        model: config.model,
        node,
        review: reviewState.review,
        allNodes: graph.nodes,
      })
      patchNode(node.id, fixed)
      setNodeReview(node.id, { fixing: false, review: null })
      setActiveTab('Dev')
    } catch (err) {
      setNodeReview(node.id, { fixing: false, fixError: err.message })
    }
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

      <div className="flex gap-2 mb-4 flex-wrap">
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
            {tab === 'Review' && reviewState.review && (
              <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-warning align-middle" />
            )}
          </button>
        ))}
        <button
          onClick={handleReview}
          disabled={reviewState.loading}
          className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold bg-canvas dark:bg-zinc-700 text-ink dark:text-zinc-300 border border-mute dark:border-zinc-600 hover:bg-primary-pale dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {reviewState.loading ? 'Reviewing…' : '🔍 Review'}
        </button>
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

      {activeTab === 'Review' && (
        <div className="space-y-4">
          {reviewState.loading && (
            <div className="flex items-center gap-2 text-sm text-mute">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analysing architecture…
            </div>
          )}

          {reviewState.error && (
            <div className="px-3 py-2 rounded-xl bg-negative-bg text-canvas text-sm font-semibold">
              ⚠ {reviewState.error}
            </div>
          )}

          {reviewState.fixError && (
            <div className="px-3 py-2 rounded-xl bg-negative-bg text-canvas text-sm font-semibold">
              ⚠ Fix failed: {reviewState.fixError}
            </div>
          )}

          {reviewState.review && (
            <>
              <pre className="text-xs bg-canvas dark:bg-zinc-900 border border-mute dark:border-zinc-700 rounded-xl p-3 overflow-x-auto text-ink dark:text-zinc-300 font-mono whitespace-pre-wrap">
                {reviewState.review}
              </pre>
              <button
                onClick={handleFix}
                disabled={reviewState.fixing}
                className="w-full bg-warning text-ink font-semibold text-sm rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {reviewState.fixing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Fixing…
                  </>
                ) : (
                  '⚡ Fix Conflicts'
                )}
              </button>
            </>
          )}

          {!reviewState.loading && !reviewState.review && !reviewState.error && (
            <p className="text-sm text-mute">Click "Review" to analyse this node for architectural conflicts.</p>
          )}
        </div>
      )}
    </div>
  )
}

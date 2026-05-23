import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { reviewNode, fixNode, analyzeNodeDepth, PATTERN_META } from '../lib/deepseek'

const TABS = ['Dev', 'EA', 'SA', 'Review', 'Depth']

const RISK_STYLES = {
  low: 'bg-primary-pale text-positive-deep',
  medium: 'bg-warning text-warning-content',
  high: 'bg-negative-bg text-canvas',
}

const CATEGORY_STYLES = {
  structural:    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  behavioral:    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  architectural: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
}

const CATEGORY_LABEL = {
  structural:    'Structural',
  behavioral:    'Behavioral',
  architectural: 'Architectural',
}

export default function NodeDetail() {
  const graph = useAppStore((s) => s.graph)
  const selectedNodeId = useAppStore((s) => s.selectedNodeId)
  const config = useAppStore((s) => s.config)
  const nodeReviews = useAppStore((s) => s.nodeReviews)
  const nodeDepths = useAppStore((s) => s.nodeDepths)
  const setNodeReview = useAppStore((s) => s.setNodeReview)
  const setNodeDepth = useAppStore((s) => s.setNodeDepth)
  const patchNode = useAppStore((s) => s.patchNode)
  const [activeTab, setActiveTab] = useState('Dev')
  const [copied, setCopied] = useState(false)

  if (!graph || !selectedNodeId) return null

  const node = graph.nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  const reviewState = nodeReviews[node.id] ?? {}
  const depthState = nodeDepths[node.id] ?? {}

  async function handleDepth() {
    setNodeDepth(node.id, { loading: true, error: null })
    setActiveTab('Depth')
    try {
      const depth = await analyzeNodeDepth({
        apiKey: config.apiKey,
        model: config.model,
        node,
        allNodes: graph.nodes,
      })
      setNodeDepth(node.id, { loading: false, depth })
    } catch (err) {
      setNodeDepth(node.id, { loading: false, error: err.message })
    }
  }

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
          {(() => {
            const meta = PATTERN_META[node.pattern]
            const catStyle = CATEGORY_STYLES[meta?.category] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
            const catLabel = CATEGORY_LABEL[meta?.category] ?? 'Pattern'
            return (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-pill text-xs font-bold ${catStyle}`}>
                  {catLabel}
                </span>
                <span
                  className="text-sm font-semibold text-ink dark:text-zinc-200"
                  title={meta?.desc ?? ''}
                >
                  {node.pattern}
                </span>
                {meta?.desc && (
                  <span className="text-xs text-mute dark:text-zinc-500 italic">— {meta.desc}</span>
                )}
              </div>
            )
          })()}
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
            {tab === 'Depth' && depthState.depth && (
              <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-teal-400 align-middle" />
            )}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleReview}
            disabled={reviewState.loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-canvas dark:bg-zinc-700 text-ink dark:text-zinc-300 border border-mute dark:border-zinc-600 hover:bg-primary-pale dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {reviewState.loading ? 'Reviewing…' : '🔍 Review'}
          </button>
          <button
            onClick={handleDepth}
            disabled={depthState.loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-canvas dark:bg-zinc-700 text-ink dark:text-zinc-300 border border-mute dark:border-zinc-600 hover:bg-primary-pale dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {depthState.loading ? 'Analysing…' : '🧠 Depth'}
          </button>
        </div>
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
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Owned Files</p>
            {(node.ownedFiles ?? []).length > 0 ? (
              <ul className="space-y-1">
                {node.ownedFiles.map((f) => (
                  <li key={f} className="text-xs font-mono bg-canvas dark:bg-zinc-900 border border-mute dark:border-zinc-700 rounded-lg px-2 py-1 text-ink dark:text-zinc-300">
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mute">None declared.</p>
            )}
          </div>
          {(node.sharedFiles ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Shared From Other Nodes</p>
              <ul className="space-y-1">
                {node.sharedFiles.map((sf, i) => {
                  const owner = graph.nodes.find((n) => n.id === sf.ownedBy)
                  return (
                    <li key={i} className="text-xs font-mono bg-canvas dark:bg-zinc-900 border border-mute dark:border-zinc-700 rounded-lg px-2 py-1 text-ink dark:text-zinc-300 flex items-center justify-between gap-2">
                      <span>{sf.file}</span>
                      <span className="shrink-0 text-mute dark:text-zinc-500">← {owner?.label ?? sf.ownedBy}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
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

      {activeTab === 'Depth' && (
        <div className="space-y-5">
          {depthState.loading && (
            <div className="flex items-center gap-2 text-sm text-mute">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Running deep analysis…
            </div>
          )}
          {depthState.error && (
            <div className="px-3 py-2 rounded-xl bg-negative-bg text-canvas text-sm font-semibold">
              ⚠ {depthState.error}
            </div>
          )}
          {!depthState.loading && !depthState.depth && !depthState.error && (
            <p className="text-sm text-mute">Click "🧠 Depth" to run engineering analysis.</p>
          )}
          {depthState.depth && (() => {
            const d = depthState.depth
            return (
              <>
                <DepthSection title="SOLID Principles">
                  <p className="text-xs font-semibold text-mute mb-1">Applicable</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(d.solid?.applicable ?? []).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-pill text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{s}</span>
                    ))}
                  </div>
                  {(d.solid?.violations ?? []).length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-mute mb-1">Violations</p>
                      <ul className="text-xs text-body dark:text-zinc-300 list-disc list-inside mb-2 space-y-0.5">
                        {d.solid.violations.map((v, i) => <li key={i}>{v}</li>)}
                      </ul>
                    </>
                  )}
                  <p className="text-xs text-body dark:text-zinc-300">{d.solid?.guidance}</p>
                </DepthSection>

                <DepthSection title="NFR Deep Dive">
                  <DepthRow label="Security" value={d.nfr?.security} />
                  <DepthRow label="Caching" value={d.nfr?.caching} />
                  <DepthRow label="Rate Limiting" value={d.nfr?.rateLimiting} />
                  {(d.nfr?.other ?? []).length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs font-semibold text-mute mb-1">Additional NFRs</p>
                      <div className="flex flex-wrap gap-1">
                        {d.nfr.other.map((o) => (
                          <span key={o} className="px-2 py-0.5 rounded-pill text-xs font-semibold bg-canvas-soft dark:bg-zinc-700 text-ink dark:text-zinc-300">{o}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </DepthSection>

                <DepthSection title="12-Factor App">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(d.twelveFactor?.applicable ?? []).map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded-pill text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">{f}</span>
                    ))}
                  </div>
                  <p className="text-xs text-body dark:text-zinc-300">{d.twelveFactor?.guidance}</p>
                </DepthSection>

                <DepthSection title="Defensive Programming">
                  {(d.defensiveProgramming?.dataBoundaries ?? []).length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-mute mb-1">Data Boundaries</p>
                      <ul className="text-xs text-body dark:text-zinc-300 list-disc list-inside mb-2 space-y-0.5">
                        {d.defensiveProgramming.dataBoundaries.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </>
                  )}
                  {(d.defensiveProgramming?.validations ?? []).length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-mute mb-1">Validations Needed</p>
                      <ul className="text-xs text-body dark:text-zinc-300 list-disc list-inside mb-2 space-y-0.5">
                        {d.defensiveProgramming.validations.map((v, i) => <li key={i}>{v}</li>)}
                      </ul>
                    </>
                  )}
                  <DepthRow label="Error Handling" value={d.defensiveProgramming?.errorHandling} />
                </DepthSection>

                <DepthSection title="Testing Strategy">
                  <DepthRow label="Unit Tests" value={d.testingStrategy?.unitTests} />
                  <DepthRow label="Integration Tests" value={d.testingStrategy?.integrationTests} />
                  <DepthRow label="E2E Tests" value={d.testingStrategy?.e2eTests} />
                  <DepthRow label="Mocking" value={d.testingStrategy?.mocking} />
                </DepthSection>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function DepthSection({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-2">{title}</p>
      <div className="bg-canvas dark:bg-zinc-900 border border-mute dark:border-zinc-700 rounded-xl p-3 space-y-2">
        {children}
      </div>
    </div>
  )
}

function DepthRow({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-semibold text-ink dark:text-zinc-300 mb-0.5">{label}</p>
      <p className="text-xs text-body dark:text-zinc-400">{value}</p>
    </div>
  )
}

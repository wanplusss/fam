import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { generateFileStubs } from '../lib/deepseek'

// Can be used standalone (reads selectedEdge from store) or with explicit edge prop (fullscreen panel)
export default function EdgeHandoff({ edge: edgeProp }) {
  const selectedEdge = useAppStore((s) => s.selectedEdge)
  const graph = useAppStore((s) => s.graph)
  const config = useAppStore((s) => s.config)
  const nodeFiles = useAppStore((s) => s.nodeFiles)
  const setNodeFiles = useAppStore((s) => s.setNodeFiles)

  const edge = edgeProp ?? selectedEdge
  const [activeFile, setActiveFile] = useState(null)
  const [copied, setCopied] = useState(false)

  if (!edge || !graph) return null

  const sourceNode = graph.nodes.find((n) => n.id === edge.source)
  const targetNode = graph.nodes.find((n) => n.id === edge.target)
  if (!sourceNode || !targetNode) return null

  const passed = edge.sharedFiles ?? []
  const sourceFileState = nodeFiles[sourceNode.id] ?? {}

  async function loadStubs() {
    if (sourceFileState.stubs || sourceFileState.loading) return
    setNodeFiles(sourceNode.id, { loading: true, error: null })
    try {
      const stubs = await generateFileStubs({
        apiKey: config.apiKey,
        model: config.model,
        node: sourceNode,
        allNodes: graph.nodes,
      })
      setNodeFiles(sourceNode.id, { loading: false, stubs })
      if (passed.length > 0) setActiveFile(passed[0].file)
    } catch (err) {
      setNodeFiles(sourceNode.id, { loading: false, error: err.message })
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const stubs = sourceFileState.stubs ?? {}
  const currentStub = activeFile ? stubs[activeFile] : null

  // Build import line for the consuming node
  function buildImport(sf) {
    const fname = sf.file.split('/').pop().replace(/\.[^.]+$/, '')
    const relativePath = sf.file.startsWith('src/') ? sf.file.replace(/\.[^.]+$/, '') : sf.file
    if (sf.exportName) {
      return `import { ${sf.exportName} } from '${relativePath}'`
    }
    return `import ${fname} from '${relativePath}'`
  }

  return (
    <div className="bg-canvas dark:bg-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-xs font-semibold text-mute uppercase tracking-wide">From</p>
          <p className="text-sm font-black text-ink dark:text-white">{sourceNode.label}</p>
          <p className="text-xs text-mute">{sourceNode.pattern}</p>
        </div>
        <div className="flex-1 flex items-center gap-1">
          <div className="flex-1 h-px bg-mute dark:bg-zinc-600" />
          <span className="text-xs text-mute px-1">→</span>
          <div className="flex-1 h-px bg-mute dark:bg-zinc-600" />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-mute uppercase tracking-wide">To</p>
          <p className="text-sm font-black text-ink dark:text-white">{targetNode.label}</p>
          <p className="text-xs text-mute">{targetNode.pattern}</p>
        </div>
      </div>

      {/* passed files */}
      {passed.length === 0 ? (
        <p className="text-sm text-mute">No declared file handoffs on this edge.</p>
      ) : (
        <>
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-2">Files Passed</p>
            <div className="flex flex-wrap gap-2">
              {passed.map((sf) => (
                <button
                  key={sf.file}
                  onClick={() => { setActiveFile(sf.file); if (!sourceFileState.stubs) loadStubs() }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono border transition-colors ${
                    activeFile === sf.file
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-canvas-soft dark:bg-zinc-700 text-ink dark:text-zinc-300 border-mute dark:border-zinc-600 hover:bg-primary-pale'
                  }`}
                >
                  {sf.file.split('/').pop()}
                  {sf.exportName && <span className="ml-1 opacity-70">→ {sf.exportName}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* import statement for consumer */}
          {activeFile && (
            <div>
              <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">
                Import in <span className="text-ink dark:text-zinc-200">{targetNode.label}</span>
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-canvas-soft dark:bg-zinc-900 border border-mute dark:border-zinc-700 rounded-lg px-3 py-2 text-primary dark:text-primary font-mono">
                  {buildImport(passed.find((sf) => sf.file === activeFile))}
                </code>
                <button
                  onClick={() => copyCode(buildImport(passed.find((sf) => sf.file === activeFile)))}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-active transition-colors shrink-0"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* stub code viewer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-mute uppercase tracking-wide">
                File Stub {activeFile ? `— ${activeFile.split('/').pop()}` : ''}
              </p>
              {!sourceFileState.stubs && !sourceFileState.loading && (
                <button
                  onClick={loadStubs}
                  className="text-xs font-semibold px-3 py-1 rounded-lg bg-canvas-soft dark:bg-zinc-700 border border-mute dark:border-zinc-600 text-ink dark:text-zinc-300 hover:bg-primary-pale transition-colors"
                >
                  ⚡ Generate Stubs
                </button>
              )}
              {currentStub && (
                <button
                  onClick={() => copyCode(currentStub)}
                  className="text-xs font-semibold px-3 py-1 rounded-lg bg-primary text-on-primary hover:bg-primary-active transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              )}
            </div>

            {sourceFileState.loading && (
              <div className="flex items-center gap-2 text-sm text-mute py-3">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating file stubs…
              </div>
            )}

            {sourceFileState.error && (
              <div className="px-3 py-2 rounded-xl bg-negative-bg text-canvas text-sm font-semibold">
                ⚠ {sourceFileState.error}
              </div>
            )}

            {currentStub ? (
              <pre className="text-xs bg-canvas-soft dark:bg-zinc-900 border border-mute dark:border-zinc-700 rounded-xl p-3 overflow-x-auto text-ink dark:text-zinc-300 font-mono whitespace-pre-wrap max-h-80">
                {currentStub}
              </pre>
            ) : sourceFileState.stubs && !currentStub ? (
              <p className="text-xs text-mute">Select a file above to view its stub.</p>
            ) : !sourceFileState.loading && !sourceFileState.stubs ? (
              <p className="text-xs text-mute">Click "Generate Stubs" to see file contracts for {sourceNode.label}.</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

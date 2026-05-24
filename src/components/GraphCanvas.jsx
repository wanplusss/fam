import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react'
import { useAppStore } from '../store/useAppStore'
import { useGraphLayout } from '../hooks/useGraphLayout'
import NodeDetail from './NodeDetail'
import EdgeHandoff from './EdgeHandoff'

function FamNode({ data }) {
  return (
    <div className="bg-canvas border border-mute rounded-xl px-4 py-3 min-w-[140px] relative shadow-sm">
      <Handle type="target" position={Position.Top} style={{ background: '#868685' }} />
      <div
        className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-canvas"
        style={{ backgroundColor: data.riskColor }}
      />
      <p className="text-sm font-semibold text-ink leading-tight">{data.label}</p>
      <Handle type="source" position={Position.Bottom} style={{ background: '#868685' }} />
    </div>
  )
}

const nodeTypes = { famNode: FamNode }

function Flow({ onFullscreen }) {
  const graph = useAppStore((s) => s.graph)
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId)
  const setSelectedEdge = useAppStore((s) => s.setSelectedEdge)
  const [layoutVersion, setLayoutVersion] = useState(0)
  const { nodes: layoutNodes, edges: layoutEdges } = useGraphLayout(layoutVersion)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    setNodes(layoutNodes)
    setEdges(layoutEdges)
  }, [layoutNodes, layoutEdges, setNodes, setEdges])

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id)
    setSelectedEdge(null)
  }, [setSelectedNodeId, setSelectedEdge])

  const onEdgeClick = useCallback((_, edge) => {
    if (!graph) return
    const targetNode = graph.nodes.find((n) => n.id === edge.target)
    const passed = (targetNode?.sharedFiles ?? []).filter((sf) => sf.ownedBy === edge.source)
    setSelectedEdge({ source: edge.source, target: edge.target, label: edge.label, sharedFiles: passed })
    setSelectedNodeId(null)
  }, [graph, setSelectedEdge, setSelectedNodeId])

  if (!graph) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-mute gap-3">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
        </svg>
        <p className="text-sm font-semibold">Enter features above and click Generate Architecture</p>
      </div>
    )
  }

  return (
    <>
      {graph.nodes.length > 15 && (
        <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-pill bg-warning text-warning-content text-xs font-semibold">
          ⚠ {graph.nodes.length} nodes — graph may be dense
        </div>
      )}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={() => setLayoutVersion((v) => v + 1)}
          className="px-3 py-1 rounded-pill bg-canvas border border-mute text-ink text-xs font-semibold hover:bg-primary-pale transition-colors shadow-sm"
        >
          ↻ Reorganize
        </button>
        {onFullscreen && (
          <button
            onClick={onFullscreen}
            className="px-3 py-1 rounded-pill bg-canvas border border-mute text-ink text-xs font-semibold hover:bg-primary-pale transition-colors shadow-sm"
            title="Fullscreen"
          >
            ⛶ Fullscreen
          </button>
        )}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-canvas"
      >
        <MiniMap nodeColor={(n) => n.data?.riskColor ?? '#868685'} />
        <Controls />
        <Background color="#e8ebe6" gap={16} />
      </ReactFlow>
    </>
  )
}

function FullscreenOverlay({ onClose }) {
  const selectedNodeId = useAppStore((s) => s.selectedNodeId)
  const selectedEdge = useAppStore((s) => s.selectedEdge)
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId)
  const setSelectedEdge = useAppStore((s) => s.setSelectedEdge)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-canvas-soft dark:bg-zinc-900 flex flex-col">
      {/* header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-canvas dark:bg-zinc-800 border-b border-mute dark:border-zinc-700 shrink-0">
        <span className="text-sm font-black text-ink dark:text-white">Recode</span>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-xl text-sm font-semibold bg-canvas-soft dark:bg-zinc-700 text-ink dark:text-zinc-300 border border-mute dark:border-zinc-600 hover:bg-primary-pale transition-colors"
        >
          ✕ Exit Fullscreen <span className="text-mute text-xs ml-1">ESC</span>
        </button>
      </div>

      {/* body: graph + optional side panel */}
      <div className="flex flex-1 min-h-0">
        {/* graph fills remaining space */}
        <div className="flex-1 relative min-w-0">
          <ReactFlowProvider>
            <Flow onFullscreen={null} />
          </ReactFlowProvider>
        </div>

        {/* side panel — node detail or edge handoff */}
        {(selectedNodeId || selectedEdge) && (
          <div className="w-[440px] shrink-0 overflow-y-auto border-l border-mute dark:border-zinc-700 bg-canvas dark:bg-zinc-800">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-xs font-semibold text-mute uppercase tracking-wide">
                {selectedNodeId ? 'Node Detail' : 'File Handoff'}
              </span>
              <button
                onClick={() => { setSelectedNodeId(null); setSelectedEdge(null) }}
                className="text-xs text-mute hover:text-ink dark:hover:text-white transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <div className="px-4 pb-6">
              {selectedNodeId && <NodeDetail />}
              {selectedEdge && <EdgeHandoff edge={selectedEdge} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GraphCanvas() {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
      <div className="bg-canvas rounded-xl shadow-sm overflow-hidden relative" style={{ height: 500 }}>
        <ReactFlowProvider>
          <Flow onFullscreen={() => setFullscreen(true)} />
        </ReactFlowProvider>
      </div>

      {fullscreen && <FullscreenOverlay onClose={() => setFullscreen(false)} />}
    </>
  )
}

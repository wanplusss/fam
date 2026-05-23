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

function Flow() {
  const graph = useAppStore((s) => s.graph)
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId)
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
  }, [setSelectedNodeId])

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
      <button
        onClick={() => setLayoutVersion((v) => v + 1)}
        className="absolute top-3 right-3 z-10 px-3 py-1 rounded-pill bg-canvas border border-mute text-ink text-xs font-semibold hover:bg-primary-pale transition-colors shadow-sm"
      >
        ↻ Reorganize
      </button>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
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

export default function GraphCanvas() {
  return (
    <div className="bg-canvas rounded-xl shadow-sm overflow-hidden relative" style={{ height: 500 }}>
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </div>
  )
}

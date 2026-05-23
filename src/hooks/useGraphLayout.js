import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'

const RISK_COLORS = {
  low: '#9fe870',
  medium: '#ffd11a',
  high: '#d03238',
}

// Topological sort for DAG layering
function topoSort(nodes, edges) {
  const ids = nodes.map((n) => n.id)
  const inDeg = Object.fromEntries(ids.map((id) => [id, 0]))
  const adj = Object.fromEntries(ids.map((id) => [id, []]))

  for (const e of edges) {
    if (inDeg[e.target] !== undefined && adj[e.source] !== undefined) {
      inDeg[e.target]++
      adj[e.source].push(e.target)
    }
  }

  const queue = ids.filter((id) => inDeg[id] === 0)
  const order = []
  while (queue.length) {
    const cur = queue.shift()
    order.push(cur)
    for (const nb of adj[cur]) {
      inDeg[nb]--
      if (inDeg[nb] === 0) queue.push(nb)
    }
  }
  // Append any remaining (cycles)
  for (const id of ids) {
    if (!order.includes(id)) order.push(id)
  }
  return order
}

// Assign layers (longest-path layering)
function assignLayers(nodes, edges) {
  const ids = nodes.map((n) => n.id)
  const layer = Object.fromEntries(ids.map((id) => [id, 0]))
  const order = topoSort(nodes, edges)

  for (const id of order) {
    const outEdges = edges.filter((e) => e.source === id)
    for (const e of outEdges) {
      if (layer[e.target] !== undefined) {
        layer[e.target] = Math.max(layer[e.target], layer[id] + 1)
      }
    }
  }
  return layer
}

export function useGraphLayout(layoutVersion = 0) {
  const graph = useAppStore((s) => s.graph)

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] }

    const layerMap = assignLayers(graph.nodes, graph.edges)
    const maxLayer = Math.max(0, ...Object.values(layerMap))

    // Group nodes by layer
    const byLayer = {}
    for (let l = 0; l <= maxLayer; l++) byLayer[l] = []
    for (const node of graph.nodes) {
      const l = layerMap[node.id] ?? 0
      byLayer[l].push(node.id)
    }

    const COL_W = 240
    const ROW_H = 160
    const posMap = {}

    for (let l = 0; l <= maxLayer; l++) {
      const group = byLayer[l] ?? []
      const totalW = group.length * COL_W
      const startX = -totalW / 2 + COL_W / 2
      group.forEach((id, i) => {
        posMap[id] = { x: startX + i * COL_W, y: l * ROW_H + 80 }
      })
    }

    const nodes = graph.nodes.map((node) => ({
      id: node.id,
      type: 'famNode',
      position: posMap[node.id] ?? { x: 0, y: 0 },
      data: {
        label: node.label,
        riskLevel: node.riskLevel,
        riskColor: RISK_COLORS[node.riskLevel] ?? '#868685',
        node,
      },
    }))

    const nodeById = Object.fromEntries(graph.nodes.map((n) => [n.id, n]))

    const edges = graph.edges.map((edge, i) => {
      const targetNode = nodeById[edge.target]
      const passedFiles = (targetNode?.sharedFiles ?? [])
        .filter((sf) => sf.ownedBy === edge.source)
        .map((sf) => sf.file.split('/').pop())

      const fileLabel = passedFiles.length > 0 ? passedFiles.join(', ') : null
      const label = fileLabel ? `${fileLabel}` : (edge.label ?? '')

      return {
        id: `e-${i}`,
        source: edge.source,
        target: edge.target,
        label,
        style: { stroke: '#868685' },
        labelStyle: { fontSize: 10, fill: '#454745', fontFamily: 'monospace' },
        labelBgStyle: { fill: '#f5f7f4', fillOpacity: 0.85 },
        labelBgPadding: [4, 6],
        labelBgBorderRadius: 6,
      }
    })

    return { nodes, edges }
  // layoutVersion included so button press triggers recalculation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, layoutVersion])

  return { nodes, edges }
}

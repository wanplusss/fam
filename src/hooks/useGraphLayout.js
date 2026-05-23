import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'

const RISK_COLORS = {
  low: '#9fe870',
  medium: '#ffd11a',
  high: '#d03238',
}

export function useGraphLayout() {
  const graph = useAppStore((s) => s.graph)

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] }

    const nodes = graph.nodes.map((node, i) => ({
      id: node.id,
      type: 'famNode',
      position: {
        x: 150 + (i % 4) * 220,
        y: 100 + Math.floor(i / 4) * 160,
      },
      data: {
        label: node.label,
        riskLevel: node.riskLevel,
        riskColor: RISK_COLORS[node.riskLevel] ?? '#868685',
        node,
      },
    }))

    const edges = graph.edges.map((edge, i) => ({
      id: `e-${i}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      style: { stroke: '#868685' },
      labelStyle: { fontSize: 11, fill: '#454745' },
    }))

    return { nodes, edges }
  }, [graph])

  return { nodes, edges }
}

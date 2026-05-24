const RISK_WEIGHT = { low: 1, medium: 2, high: 3 }

function parseEffortDays(str) {
  if (!str) return 3
  const s = str.toLowerCase()
  const match = s.match(/(\d+(\.\d+)?)/)
  if (!match) return 3
  const n = parseFloat(match[1])
  if (s.includes('week')) return n * 5
  if (s.includes('month')) return n * 20
  return n
}

function topoSort(nodes, deps) {
  // deps: { [nodeId]: string[] } — ids this node depends on
  const ids = nodes.map((n) => n.id)
  const inDeg = Object.fromEntries(ids.map((id) => [id, 0]))
  const adj = Object.fromEntries(ids.map((id) => [id, []]))

  for (const id of ids) {
    for (const dep of deps[id] ?? []) {
      if (inDeg[id] !== undefined && adj[dep] !== undefined) {
        inDeg[id]++
        adj[dep].push(id)
      }
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
  for (const id of ids) {
    if (!order.includes(id)) order.push(id)
  }
  return order
}

function findCriticalPath(nodes, deps) {
  // Longest path by effort days through dependency graph
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const effort = Object.fromEntries(nodes.map((n) => [n.id, parseEffortDays(n.effortEstimate)]))

  // dp[id] = { cost, path[] }
  const dp = Object.fromEntries(nodes.map((n) => [n.id, { cost: 0, path: [] }]))
  const order = topoSort(nodes, deps)

  for (const id of order) {
    const node = nodeById[id]
    if (!node) continue
    const myEffort = effort[id]
    let best = { cost: 0, path: [] }
    for (const depId of deps[id] ?? []) {
      if (dp[depId] && dp[depId].cost > best.cost) best = dp[depId]
    }
    dp[id] = { cost: best.cost + myEffort, path: [...best.path, id] }
  }

  let critical = { cost: 0, path: [] }
  for (const val of Object.values(dp)) {
    if (val.cost > critical.cost) critical = val
  }
  return critical
}

export function computeBuildOrder(graph) {
  if (!graph || graph.nodes.length === 0) return null

  const { nodes, edges } = graph

  // Build deps map from node.dependencies[]
  const deps = Object.fromEntries(nodes.map((n) => [n.id, n.dependencies ?? []]))

  const topoOrder = topoSort(nodes, deps)
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]))

  // Score each node: lower = build sooner
  // Foundation score: position in topo order (0 = earliest)
  // Within same topo layer, sort by: risk DESC (build risky things early), effort ASC
  const topoPos = Object.fromEntries(topoOrder.map((id, i) => [id, i]))

  const scored = nodes.map((node) => {
    const effort = parseEffortDays(node.effortEstimate)
    const risk = RISK_WEIGHT[node.riskLevel] ?? 1
    const depCount = (node.dependencies ?? []).length
    const blocksCount = nodes.filter((n) => (n.dependencies ?? []).includes(node.id)).length
    return {
      node,
      topoPos: topoPos[node.id] ?? 999,
      effort,
      risk,
      depCount,
      blocksCount,
      // Score: topo position primary, then nodes that block many others first, then risk
      score: topoPos[node.id] * 1000 - blocksCount * 10 - risk,
    }
  })

  scored.sort((a, b) => a.score - b.score)

  // Group into phases by topo layer
  const maxPos = Math.max(...scored.map((s) => s.topoPos))
  const phases = []
  // Layer = topoPos bucket (0, 1-3, 4-7, etc. — group nodes with no mutual deps)
  // Simple approach: group by topoPos value
  const byPos = {}
  for (const s of scored) {
    const p = s.topoPos
    if (!byPos[p]) byPos[p] = []
    byPos[p].push(s)
  }
  const posKeys = Object.keys(byPos).map(Number).sort((a, b) => a - b)
  let phase = 1
  for (const pos of posKeys) {
    phases.push({ phase, items: byPos[pos] })
    phase++
  }

  const critical = findCriticalPath(nodes, deps)
  const criticalSet = new Set(critical.path)

  const totalDays = scored.reduce((sum, s) => sum + s.effort, 0)
  const criticalDays = Math.round(critical.cost)

  return { phases, criticalSet, criticalDays, totalDays, nodeById }
}

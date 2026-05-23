// Returns { valid: true, data } or { valid: false, error: string }
export function validateGraph(raw) {
  let parsed
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return { valid: false, error: 'AI returned invalid JSON. Try again.' }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'AI response is not an object.' }
  }

  if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
    return { valid: false, error: 'AI response missing nodes array.' }
  }

  if (!Array.isArray(parsed.edges)) {
    return { valid: false, error: 'AI response missing edges array.' }
  }

  const RISK_LEVELS = ['low', 'medium', 'high']
  const REQUIRED_NODE_FIELDS = [
    'id', 'label', 'pattern', 'dataFlow', 'riskLevel',
    'nfrTags', 'folderStructure', 'businessReason',
    'effortEstimate', 'agentPrompt', 'dependencies',
  ]

  for (const node of parsed.nodes) {
    for (const field of REQUIRED_NODE_FIELDS) {
      if (node[field] === undefined || node[field] === null) {
        return { valid: false, error: `Node "${node.id ?? '?'}" missing field: ${field}` }
      }
    }
    if (!RISK_LEVELS.includes(node.riskLevel)) {
      return { valid: false, error: `Node "${node.id}" has invalid riskLevel: ${node.riskLevel}` }
    }
    if (!Array.isArray(node.nfrTags)) {
      return { valid: false, error: `Node "${node.id}" nfrTags must be an array.` }
    }
    if (!Array.isArray(node.dependencies)) {
      return { valid: false, error: `Node "${node.id}" dependencies must be an array.` }
    }
  }

  for (const edge of parsed.edges) {
    if (!edge.source || !edge.target) {
      return { valid: false, error: 'Edge missing source or target.' }
    }
  }

  return { valid: true, data: parsed }
}

import { PATTERNS } from './deepseek'

// Returns { valid: true, data } or { valid: false, error: string }
export function validateGraph(raw) {
  let parsed
  try {
    let cleaned = typeof raw === 'string' ? raw : JSON.stringify(raw)

    // Strip markdown code fences
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    // If model returned thinking text before JSON, extract the JSON object/array
    const jsonStart = cleaned.search(/[{[]/)
    if (jsonStart > 0) cleaned = cleaned.slice(jsonStart)

    // Trim any trailing text after the JSON
    const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
    if (lastBrace !== -1 && lastBrace < cleaned.length - 1) cleaned = cleaned.slice(0, lastBrace + 1)

    parsed = JSON.parse(cleaned)
  } catch {
    const preview = typeof raw === 'string' ? raw.slice(0, 300) : String(raw)
    console.error('AI raw output:', raw)
    return { valid: false, error: `Invalid JSON from AI. Check console for raw output. Preview: ${preview}` }
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
    if (!PATTERNS.includes(node.pattern)) {
      // Soft coerce: find closest match by prefix, otherwise keep as-is (don't break on unknown)
      const match = PATTERNS.find((p) => p.toLowerCase().startsWith(node.pattern.toLowerCase().slice(0, 4)))
      if (match) node.pattern = match
    }
    // Default optional fields if model omitted them
    if (!Array.isArray(node.ownedFiles)) node.ownedFiles = []
    if (!Array.isArray(node.sharedFiles)) node.sharedFiles = []
  }

  for (const edge of parsed.edges) {
    if (!edge.source || !edge.target) {
      return { valid: false, error: 'Edge missing source or target.' }
    }
  }

  return { valid: true, data: parsed }
}

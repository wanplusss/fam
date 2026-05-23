const BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com'

const SCHEMA_DESCRIPTION = `{
  "nodes": [{
    "id": "string (unique)",
    "label": "string (feature name)",
    "pattern": "string (e.g. Repository, CQRS, Observer)",
    "dataFlow": "string (describe how data moves)",
    "riskLevel": "low | medium | high",
    "nfrTags": ["string (e.g. Scalability, Security, Performance)"],
    "folderStructure": "string (e.g. src/features/auth/\\n  authService.js\\n  authController.js)",
    "businessReason": "string (why this feature matters to the business)",
    "effortEstimate": "string (e.g. 3 days, 1 week)",
    "agentPrompt": "string (copy-paste prompt for a coding agent to implement this feature)",
    "dependencies": ["string (ids of nodes this node depends on)"]
  }],
  "edges": [{
    "source": "string (node id)",
    "target": "string (node id)",
    "label": "string (relationship description)"
  }]
}`

function buildExistingGraphContext(existingGraph) {
  if (!existingGraph) return ''

  const nodesSummary = existingGraph.nodes.map((n) =>
    `- ID: ${n.id} | Label: ${n.label} | Pattern: ${n.pattern} | DataFlow: ${n.dataFlow} | Folder: ${n.folderStructure.split('\n')[0]}`
  ).join('\n')

  const edgesSummary = existingGraph.edges.map((e) =>
    `- ${e.source} → ${e.target} (${e.label})`
  ).join('\n')

  return `\n\nEXISTING ARCHITECTURE CONTEXT (you are ADDING to this — reference it for data flows, dependencies, shared modules, and folder structure consistency):\n\nExisting nodes:\n${nodesSummary}\n\nExisting edges:\n${edgesSummary}\n\nRules:\n1. New node IDs must be unique and NOT duplicate any existing ID above.\n2. New nodes may reference existing node IDs in their dependencies[] array.\n3. New edges may connect new nodes to existing node IDs.\n4. Reuse existing folder paths where the new feature belongs in the same module.\n5. Describe data flows that reference existing services/repositories where relevant.`
}

export async function analyzeFeatures({ apiKey, model, features, integrations, existingGraph }) {
  const integrationText = integrations.length > 0
    ? `Integrations in use: ${integrations.join(', ')}.`
    : 'No specific integrations selected.'

  const existingContext = buildExistingGraphContext(existingGraph)

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert software architect. Analyse the feature list and return ONLY valid JSON matching the schema. No markdown, no explanation, no code fences — raw JSON only.',
        },
        {
          role: 'user',
          content: `Feature list:\n${features}\n\n${integrationText}${existingContext}\n\nOutput schema:\n${SCHEMA_DESCRIPTION}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`DeepSeek API error ${response.status}: ${text}`)
  }

  const data = await response.json()
  const message = data?.choices?.[0]?.message
  const thinking = message?.reasoning_content ?? null
  const content = message?.content ?? ''

  if (!content && !thinking) {
    console.error('Full DeepSeek response:', JSON.stringify(data, null, 2))
    throw new Error('DeepSeek returned empty response. Check console for full API response.')
  }

  // content may be empty if model only returned thinking; use thinking as fallback
  return { content: content || thinking, thinking }
}

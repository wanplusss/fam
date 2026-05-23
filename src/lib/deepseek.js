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

async function callDeepSeek({ apiKey, model, system, user }) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`DeepSeek API error ${response.status}: ${text}`)
  }
  const data = await response.json()
  const message = data?.choices?.[0]?.message
  return message?.content || message?.reasoning_content || ''
}

export async function reviewNode({ apiKey, model, node, allNodes }) {
  const siblings = allNodes
    .filter((n) => n.id !== node.id)
    .map((n) => `- ${n.id}: ${n.label} (${n.pattern}) | deps: ${n.dependencies.join(', ') || 'none'}`)
    .join('\n')

  return callDeepSeek({
    apiKey,
    model,
    system: 'You are a senior enterprise architect performing a critical design review. Be direct and specific. Flag conflicts, inconsistencies, and missing concerns. Format your response in clear sections.',
    user: `Review this architecture node for conflicts and issues:

NODE:
- ID: ${node.id}
- Label: ${node.label}
- Pattern: ${node.pattern}
- Risk: ${node.riskLevel}
- Data Flow: ${node.dataFlow}
- NFR Tags: ${node.nfrTags.join(', ')}
- Folder Structure: ${node.folderStructure}
- Business Reason: ${node.businessReason}
- Effort: ${node.effortEstimate}
- Dependencies: ${node.dependencies.join(', ') || 'none'}
- Agent Prompt: ${node.agentPrompt}

OTHER NODES IN SYSTEM:
${siblings}

Identify:
1. Conflicts between the pattern tag and the agent prompt instructions
2. Missing dependencies that should be declared
3. Data flow inconsistencies with other nodes
4. NFR gaps (missing non-functional requirements for this type of feature)
5. Any agent prompt instructions that would violate the declared pattern`,
  })
}

export async function fixNode({ apiKey, model, node, review, allNodes }) {
  const siblings = allNodes
    .filter((n) => n.id !== node.id)
    .map((n) => `- ${n.id}: ${n.label} (${n.pattern})`)
    .join('\n')

  const raw = await callDeepSeek({
    apiKey,
    model,
    system: 'You are a senior enterprise architect. Return ONLY valid JSON — no markdown, no explanation, no code fences.',
    user: `Fix this architecture node based on the review findings. Return the corrected node as JSON matching the schema exactly.

ORIGINAL NODE:
${JSON.stringify(node, null, 2)}

REVIEW FINDINGS:
${review}

OTHER NODES IN SYSTEM:
${siblings}

Return a single corrected node JSON object matching this schema exactly:
{"id":"string","label":"string","pattern":"string","dataFlow":"string","riskLevel":"low|medium|high","nfrTags":["string"],"folderStructure":"string","businessReason":"string","effortEstimate":"string","agentPrompt":"string","dependencies":["string"]}`,
  })

  // extract JSON object from response
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Fix returned invalid JSON')
  return JSON.parse(raw.slice(start, end + 1))
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

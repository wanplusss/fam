const BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com'

// category: 'structural' | 'behavioral' | 'architectural'
export const PATTERN_META = {
  'Repository':              { category: 'structural',    desc: 'Abstracts data access behind a collection-like interface.' },
  'Data Mapper':             { category: 'structural',    desc: 'Maps between domain objects and database rows without coupling them.' },
  'Domain Model':            { category: 'structural',    desc: 'Rich object model encapsulating both data and business behaviour.' },
  'Facade':                  { category: 'structural',    desc: 'Simplified interface over a complex subsystem.' },
  'Adapter':                 { category: 'structural',    desc: 'Converts one interface into another that a client expects.' },
  'Factory':                 { category: 'structural',    desc: 'Delegates object creation to a specialised method or class.' },
  'Observer':                { category: 'behavioral',    desc: 'Notifies dependents automatically when state changes.' },
  'Strategy':                { category: 'behavioral',    desc: 'Selects an algorithm at runtime from a family of interchangeable ones.' },
  'Mediator':                { category: 'behavioral',    desc: 'Centralises communication between components to reduce coupling.' },
  'Pub/Sub':                 { category: 'behavioral',    desc: 'Publishers emit events; subscribers react without direct coupling.' },
  'Webhook':                 { category: 'behavioral',    desc: 'HTTP callback triggered by an event in an external system.' },
  'CQRS':                    { category: 'architectural', desc: 'Separates read (Query) and write (Command) models entirely.' },
  'Event Sourcing':          { category: 'architectural', desc: 'Stores state as an immutable log of domain events.' },
  'Saga':                    { category: 'architectural', desc: 'Manages distributed transactions via a sequence of local transactions.' },
  'BFF (Backend for Frontend)': { category: 'architectural', desc: 'Dedicated backend tailored to the needs of a specific frontend.' },
  'API Gateway':             { category: 'architectural', desc: 'Single entry point that routes, composes, and secures API calls.' },
  'Microservice':            { category: 'architectural', desc: 'Independently deployable service with a single bounded context.' },
  'Monolith Module':         { category: 'architectural', desc: 'Well-bounded module within a single deployable monolith.' },
  'Service Layer':           { category: 'architectural', desc: 'Defines application boundary; orchestrates domain objects and infrastructure.' },
  'Circuit Breaker':         { category: 'architectural', desc: 'Stops cascading failures by short-circuiting calls to failing services.' },
}

export const PATTERNS = Object.keys(PATTERN_META)

const PATTERN_LIST = PATTERNS.join(' | ')

const SCHEMA_DESCRIPTION = `{
  "nodes": [{
    "id": "string (unique)",
    "label": "string (feature name)",
    "pattern": "MUST be one of: ${PATTERN_LIST}",
    "dataFlow": "string (describe how data moves)",
    "riskLevel": "low | medium | high",
    "nfrTags": ["string (e.g. Scalability, Security, Performance)"],
    "folderStructure": "string (e.g. src/features/auth/\\n  authService.js\\n  authController.js)",
    "ownedFiles": ["string (files this node owns, e.g. src/features/auth/authService.js)"],
    "sharedFiles": [{"file": "string (file path)", "ownedBy": "string (node id that owns it)", "exportName": "string (the specific function/class/variable imported from that file, e.g. validateToken, UserRepository)"}],
    "businessReason": "string (why this feature matters to the business)",
    "effortEstimate": "string (e.g. 3 days, 1 week)",
    "agentPrompt": "string (copy-paste prompt for a coding agent to implement this feature, referencing sibling node files where relevant)",
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

  const nodesSummary = existingGraph.nodes.map((n) => {
    const files = (n.ownedFiles ?? []).join(', ') || 'none'
    return `- ID: ${n.id} | Label: ${n.label} | Pattern: ${n.pattern} | DataFlow: ${n.dataFlow} | Folder: ${n.folderStructure.split('\n')[0]} | OwnedFiles: ${files}`
  }).join('\n')

  const edgesSummary = existingGraph.edges.map((e) =>
    `- ${e.source} → ${e.target} (${e.label})`
  ).join('\n')

  return `\n\nEXISTING ARCHITECTURE CONTEXT (you are ADDING to this — reference it for data flows, dependencies, shared modules, and folder structure consistency):\n\nExisting nodes:\n${nodesSummary}\n\nExisting edges:\n${edgesSummary}\n\nRules:\n1. New node IDs must be unique and NOT duplicate any existing ID above.\n2. New nodes may reference existing node IDs in their dependencies[] array.\n3. New edges may connect new nodes to existing node IDs.\n4. Reuse existing folder paths where the new feature belongs in the same module.\n5. Describe data flows that reference existing services/repositories where relevant.`
}

async function callDeepSeek({ apiKey, model, system, user, max_tokens = 10000 }) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens,
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
{"id":"string","label":"string","pattern":"one of: ${PATTERN_LIST}","dataFlow":"string","riskLevel":"low|medium|high","nfrTags":["string"],"folderStructure":"string","ownedFiles":["string"],"sharedFiles":[{"file":"string","ownedBy":"string","exportName":"string"}],"businessReason":"string","effortEstimate":"string","agentPrompt":"string","dependencies":["string"]}`,
  })

  // extract JSON object from response
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Fix returned invalid JSON')
  return JSON.parse(raw.slice(start, end + 1))
}

export async function analyzeNodeDepth({ apiKey, model, node, allNodes }) {
  const siblings = allNodes
    .filter((n) => n.id !== node.id)
    .map((n) => `- ${n.id}: ${n.label} (${n.pattern}) | deps: ${n.dependencies.join(', ') || 'none'}`)
    .join('\n')

  const raw = await callDeepSeek({
    apiKey,
    model,
    system: 'You are a senior software engineer and architect. Return ONLY valid JSON — no markdown, no explanation, no code fences.',
    user: `Perform a deep engineering analysis of this architecture node. Return JSON with exactly these five keys.

NODE:
${JSON.stringify(node, null, 2)}

OTHER NODES IN SYSTEM:
${siblings}

Return this JSON structure exactly:
{
  "solid": {
    "applicable": ["list only the SOLID principles that genuinely apply to this node"],
    "violations": ["any SOLID violations already present in the agent prompt or design"],
    "guidance": "2-3 sentences on how to apply the relevant principles here"
  },
  "nfr": {
    "security": "specific security concerns and mitigations for this node",
    "caching": "caching strategy: what to cache, TTL, invalidation approach, or 'Not applicable'",
    "rateLimiting": "rate limiting needs: where to apply, thresholds, or 'Not applicable'",
    "other": ["any other critical NFRs for this node not already in nfrTags"]
  },
  "twelveFactor": {
    "applicable": ["12-factor app concerns relevant to this node, e.g. Config, Logs, Backing Services"],
    "guidance": "how to apply them concretely for this node"
  },
  "defensiveProgramming": {
    "dataBoundaries": ["list each external/internal data boundary this node crosses"],
    "validations": ["specific input validations needed per boundary"],
    "errorHandling": "error handling strategy: what to catch, what to propagate, fallback behaviour"
  },
  "testingStrategy": {
    "unitTests": "what to unit test and how — specific functions/behaviours",
    "integrationTests": "what integration tests are needed and against what",
    "e2eTests": "E2E scenarios to cover, or 'Not applicable'",
    "mocking": "what to mock and what must hit real dependencies"
  }
}`,
  })

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Depth analysis returned invalid JSON')
  return JSON.parse(raw.slice(start, end + 1))
}

export async function generateFileStubs({ apiKey, model, node, allNodes }) {
  if ((node.ownedFiles ?? []).length === 0) return {}

  const sharedContext = (node.sharedFiles ?? []).map((sf) => {
    const owner = allNodes.find((n) => n.id === sf.ownedBy)
    return `- ${sf.file} (from ${owner?.label ?? sf.ownedBy}): exports ${sf.exportName ?? 'unknown'}`
  }).join('\n') || 'None'

  const raw = await callDeepSeek({
    apiKey,
    model,
    system: 'You are a senior software engineer. Return ONLY valid JSON — no markdown, no explanation, no code fences.',
    user: `Generate realistic file stubs for this architecture node. Each stub should show real function signatures, JSDoc types, and named exports — NOT full implementation, just the contract.

NODE: ${node.label} (${node.pattern})
Agent Prompt: ${node.agentPrompt}
Shared imports available:
${sharedContext}

Files to stub: ${node.ownedFiles.join(', ')}

Return JSON where each key is the file path and the value is the stub code string:
{
  "src/features/auth/authService.js": "/** @param {string} token */\\nexport async function validateToken(token) {}\\n\\nexport async function login(credentials) {}"
}

Rules:
- Use the correct language based on file extension (.js = JS/ES modules, .ts = TypeScript, .py = Python, etc.)
- Show real import statements at the top referencing the shared files
- Named exports only — match what other nodes expect to import
- JSDoc or type annotations where relevant
- No implementation bodies — just signatures and exports`,
  })

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('File stubs returned invalid JSON')
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
      max_tokens: 10000,
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

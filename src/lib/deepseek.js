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

export async function analyzeFeatures({ apiKey, model, features, integrations }) {
  const integrationText = integrations.length > 0
    ? `Integrations in use: ${integrations.join(', ')}.`
    : 'No specific integrations selected.'

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert software architect. Analyse the feature list and return ONLY valid JSON matching the schema. No markdown, no explanation, no code fences — raw JSON only.',
        },
        {
          role: 'user',
          content: `Feature list:\n${features}\n\n${integrationText}\n\nOutput schema:\n${SCHEMA_DESCRIPTION}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`DeepSeek API error ${response.status}: ${text}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('DeepSeek returned empty response.')
  return content
}

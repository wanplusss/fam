# FAM — Feature Architecture Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build FAM — an AI-powered web tool that transforms a feature list into a visual architecture graph using DeepSeek, with Dev/EA/SA lens views and export capabilities.

**Architecture:** Feature-sliced component tree with custom hooks. Zustand owns all state. DeepSeek API calls are isolated behind `useAIAnalysis`. Export logic lives in pure functions in `lib/exporters.js`. Components are read-only consumers of store state.

**Tech Stack:** React 18, Vite, Zustand, React Flow, Tailwind CSS, file-saver, DeepSeek API, GitHub Actions, Netlify

---

## File Map

| File | Role |
|------|------|
| `src/store/useAppStore.js` | Zustand store — config, features, graph, selectedNodeId, loading, error |
| `src/lib/schema.js` | Validates AI JSON output — nodes + edges shape |
| `src/lib/deepseek.js` | DeepSeek API client — builds prompt, calls API, returns raw text |
| `src/hooks/useAIAnalysis.js` | Orchestrates AI call → validate → store write |
| `src/hooks/useGraphLayout.js` | Derives React Flow nodes/edges from store graph |
| `src/lib/exporters.js` | Pure export fns: toJSON, toMarkdown, toScaffold, toPrompts |
| `src/components/ConfigPanel.jsx` | API key, model selector, integrations |
| `src/components/FeatureInput.jsx` | Textarea, presets, Generate button |
| `src/components/StackDiagram.jsx` | Tech layer badges from graph nodes |
| `src/components/GraphCanvas.jsx` | React Flow wrapper, custom risk-dot nodes |
| `src/components/NodeDetail.jsx` | Dev/EA/SA tabs, copy agent prompt |
| `src/components/ExportPanel.jsx` | 4 export buttons |
| `src/App.jsx` | Vertical layout shell |
| `src/main.jsx` | Entry point |
| `src/index.css` | Wise design tokens as CSS vars + Tailwind base |
| `.github/workflows/deploy.yml` | Netlify deploy on push to main |
| `.env.example` | VITE_DEEPSEEK_BASE_URL |
| `vite.config.js` | Vite config |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/index.css`
- Create: `.env.example`
- Create: `index.html`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`

- [ ] **Step 1: Scaffold Vite + React project**

```bash
cd "d:\Users\USER\Desktop\Codes\SideProjects\FAM"
npm create vite@latest . -- --template react
```

When prompted "Current directory is not empty" → select "Ignore files and continue".  
When prompted for framework → React. Variant → JavaScript.

- [ ] **Step 2: Install all dependencies**

```bash
npm install zustand @xyflow/react file-saver
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Replace `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#9fe870',
        'on-primary': '#0e0f0c',
        'primary-active': '#cdffad',
        'primary-neutral': '#c5edab',
        'primary-pale': '#e2f6d5',
        ink: '#0e0f0c',
        'ink-deep': '#163300',
        body: '#454745',
        mute: '#868685',
        canvas: '#ffffff',
        'canvas-soft': '#e8ebe6',
        positive: '#2ead4b',
        'positive-deep': '#054d28',
        warning: '#ffd11a',
        'warning-deep': '#b86700',
        'warning-content': '#4a3b1c',
        negative: '#d03238',
        'negative-deep': '#a72027',
        'negative-bg': '#320707',
      },
      borderRadius: {
        xl: '24px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Set up index.css**

Replace `src/index.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #e8ebe6;
  font-family: 'Inter', system-ui, sans-serif;
  color: #0e0f0c;
}
```

- [ ] **Step 5: Minimal App.jsx**

```jsx
import './index.css'

export default function App() {
  return (
    <div className="min-h-screen bg-canvas-soft">
      <p className="p-8 text-ink font-semibold">FAM loading...</p>
    </div>
  )
}
```

- [ ] **Step 6: main.jsx**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: .env.example**

```
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
```

- [ ] **Step 8: Verify dev server runs**

```bash
npm run dev
```

Expected: Vite dev server starts, browser shows "FAM loading..." on sage background `#e8ebe6`.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite + React + Tailwind + Wise tokens"
```

---

## Task 2: Zustand Store

**Files:**
- Create: `src/store/useAppStore.js`

- [ ] **Step 1: Create store directory**

```bash
mkdir src/store
```

- [ ] **Step 2: Write store**

Create `src/store/useAppStore.js`:

```js
import { create } from 'zustand'

const STORAGE_KEY_API = 'fam_api_key'
const STORAGE_KEY_MODEL = 'fam_model'

export const useAppStore = create((set) => ({
  config: {
    apiKey: localStorage.getItem(STORAGE_KEY_API) ?? '',
    model: localStorage.getItem(STORAGE_KEY_MODEL) ?? 'deepseek-v4-flash',
    integrations: [],
  },
  features: '',
  graph: null,
  selectedNodeId: null,
  loading: false,
  error: null,

  setConfig: (partial) =>
    set((state) => {
      const next = { ...state.config, ...partial }
      if (partial.apiKey !== undefined) localStorage.setItem(STORAGE_KEY_API, partial.apiKey)
      if (partial.model !== undefined) localStorage.setItem(STORAGE_KEY_MODEL, partial.model)
      return { config: next }
    }),

  setFeatures: (features) => set({ features }),

  setGraph: (graph) => set({ graph, error: null }),

  setSelectedNodeId: (id) =>
    set((state) => ({ selectedNodeId: state.selectedNodeId === id ? null : id })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  clearError: () => set({ error: null }),
}))
```

- [ ] **Step 3: Verify no import errors**

```bash
npm run build 2>&1 | head -20
```

Expected: Build succeeds or only warns about unused vars — no import errors.

- [ ] **Step 4: Commit**

```bash
git add src/store/useAppStore.js
git commit -m "feat: add Zustand store with localStorage persistence"
```

---

## Task 3: Schema Validator

**Files:**
- Create: `src/lib/schema.js`

- [ ] **Step 1: Create lib directory**

```bash
mkdir src/lib
```

- [ ] **Step 2: Write schema validator**

Create `src/lib/schema.js`:

```js
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
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/schema.js
git commit -m "feat: add AI output schema validator"
```

---

## Task 4: DeepSeek API Client

**Files:**
- Create: `src/lib/deepseek.js`

- [ ] **Step 1: Write API client**

Create `src/lib/deepseek.js`:

```js
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/deepseek.js
git commit -m "feat: add DeepSeek API client with prompt builder"
```

---

## Task 5: useAIAnalysis Hook

**Files:**
- Create: `src/hooks/useAIAnalysis.js`

- [ ] **Step 1: Create hooks directory**

```bash
mkdir src/hooks
```

- [ ] **Step 2: Write hook**

Create `src/hooks/useAIAnalysis.js`:

```js
import { useAppStore } from '../store/useAppStore'
import { analyzeFeatures } from '../lib/deepseek'
import { validateGraph } from '../lib/schema'

export function useAIAnalysis() {
  const { config, features, setGraph, setLoading, setError, clearError } = useAppStore()

  async function generate() {
    if (!config.apiKey) {
      setError('API key is required. Add it in Config.')
      return
    }
    if (!features.trim()) {
      setError('Enter at least one feature before generating.')
      return
    }

    setLoading(true)
    clearError()

    try {
      const rawContent = await analyzeFeatures({
        apiKey: config.apiKey,
        model: config.model,
        features: features.trim(),
        integrations: config.integrations,
      })

      const result = validateGraph(rawContent)
      if (!result.valid) {
        setError(result.error)
        return
      }

      setGraph(result.data)
    } catch (err) {
      setError(err.message ?? 'Unknown error. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  return { generate }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAIAnalysis.js
git commit -m "feat: add useAIAnalysis hook"
```

---

## Task 6: useGraphLayout Hook

**Files:**
- Create: `src/hooks/useGraphLayout.js`

- [ ] **Step 1: Write hook**

Create `src/hooks/useGraphLayout.js`:

```js
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGraphLayout.js
git commit -m "feat: add useGraphLayout hook — derives React Flow nodes/edges from store"
```

---

## Task 7: Export Functions

**Files:**
- Create: `src/lib/exporters.js`

- [ ] **Step 1: Install file-saver (already in Task 1 — verify)**

```bash
npm ls file-saver
```

Expected: `file-saver@x.x.x` listed.

- [ ] **Step 2: Write exporters**

Create `src/lib/exporters.js`:

```js
import { saveAs } from 'file-saver'

export function toJSON(graph) {
  const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' })
  saveAs(blob, 'fam-export.json')
}

export function toMarkdown(graph) {
  const lines = ['# FAM Architecture Document\n']
  for (const node of graph.nodes) {
    lines.push(`## ${node.label}`)
    lines.push(`**Pattern:** ${node.pattern}`)
    lines.push(`**Risk:** ${node.riskLevel}`)
    lines.push(`**Effort:** ${node.effortEstimate}`)
    lines.push(`**Business Reason:** ${node.businessReason}`)
    lines.push(`**Data Flow:** ${node.dataFlow}`)
    lines.push(`**NFR Tags:** ${node.nfrTags.join(', ')}`)
    lines.push(`**Dependencies:** ${node.dependencies.join(', ') || 'None'}`)
    lines.push('')
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  saveAs(blob, 'fam-architecture.md')
}

export function toScaffold(graph) {
  const lines = ['# FAM Folder Scaffold\n']
  for (const node of graph.nodes) {
    lines.push(`## ${node.label}`)
    lines.push('```')
    lines.push(node.folderStructure)
    lines.push('```')
    lines.push('')
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  saveAs(blob, 'scaffold.txt')
}

export function toPrompts(graph) {
  const lines = ['# FAM Agent Prompts\n']
  for (const node of graph.nodes) {
    lines.push(`## ${node.label}`)
    lines.push(node.agentPrompt)
    lines.push('')
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  saveAs(blob, 'agent-prompts.txt')
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/exporters.js
git commit -m "feat: add pure export functions (JSON, Markdown, Scaffold, Agent Prompts)"
```

---

## Task 8: ConfigPanel Component

**Files:**
- Create: `src/components/ConfigPanel.jsx`

- [ ] **Step 1: Write component**

Create `src/components/ConfigPanel.jsx`:

```jsx
import { useAppStore } from '../store/useAppStore'

const INTEGRATIONS = ['Salesforce', 'REST API', 'GraphQL', 'SQL Database', 'Redis', 'Message Queue']

export default function ConfigPanel() {
  const config = useAppStore((s) => s.config)
  const setConfig = useAppStore((s) => s.setConfig)

  function toggleIntegration(name) {
    const next = config.integrations.includes(name)
      ? config.integrations.filter((i) => i !== name)
      : [...config.integrations, name]
    setConfig({ integrations: next })
  }

  return (
    <div className="bg-canvas rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-black text-ink mb-4">Configuration</h2>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-ink mb-1">DeepSeek API Key</label>
        <input
          type="password"
          value={config.apiKey}
          onChange={(e) => setConfig({ apiKey: e.target.value })}
          placeholder="sk-..."
          className="w-full border border-ink rounded-xl px-4 py-3 text-base text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-ink mb-2">Model</label>
        <div className="flex gap-2">
          {[
            { value: 'deepseek-v4-flash', label: 'Fast (V4 Flash)' },
            { value: 'deepseek-v4-pro', label: 'Best (V4 Pro)' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setConfig({ model: opt.value })}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                config.model === opt.value
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-canvas text-ink border-ink hover:bg-canvas-soft'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-2">Integrations</label>
        <div className="flex flex-wrap gap-2">
          {INTEGRATIONS.map((name) => (
            <button
              key={name}
              onClick={() => toggleIntegration(name)}
              className={`px-3 py-1 rounded-pill text-sm font-semibold border transition-colors ${
                config.integrations.includes(name)
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-canvas text-body border-mute hover:bg-canvas-soft'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ConfigPanel.jsx
git commit -m "feat: add ConfigPanel component"
```

---

## Task 9: FeatureInput Component

**Files:**
- Create: `src/components/FeatureInput.jsx`

- [ ] **Step 1: Write component**

Create `src/components/FeatureInput.jsx`:

```jsx
import { useAppStore } from '../store/useAppStore'
import { useAIAnalysis } from '../hooks/useAIAnalysis'

const PRESETS = [
  {
    label: 'SaaS App',
    value: 'User authentication\nSubscription billing\nDashboard with analytics\nEmail notifications\nAdmin panel',
  },
  {
    label: 'E-Commerce',
    value: 'Product catalogue\nShopping cart\nCheckout and payment\nOrder tracking\nInventory management',
  },
  {
    label: 'API Platform',
    value: 'API key management\nRate limiting\nWebhook delivery\nUsage analytics\nDeveloper portal',
  },
]

export default function FeatureInput() {
  const features = useAppStore((s) => s.features)
  const loading = useAppStore((s) => s.loading)
  const error = useAppStore((s) => s.error)
  const setFeatures = useAppStore((s) => s.setFeatures)
  const { generate } = useAIAnalysis()

  function handleKeyDown(e) {
    if (e.key === 'Enter' && e.ctrlKey) generate()
  }

  return (
    <div className="bg-canvas rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-black text-ink mb-4">Feature List</h2>

      <div className="flex gap-2 mb-3 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setFeatures(p.value)}
            className="px-3 py-1 rounded-pill text-sm font-semibold bg-canvas-soft text-ink hover:bg-primary-pale border border-mute transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="List your app features, one per line&#10;e.g. User authentication&#10;     Dashboard with analytics&#10;     Payment integration"
        rows={8}
        className="w-full border border-ink rounded-xl px-4 py-3 text-base text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
      />

      {error && (
        <div className="mb-3 px-3 py-2 rounded-pill bg-negative-bg text-canvas text-sm font-semibold inline-flex items-center gap-2">
          <span>⚠</span>
          <span>{error}</span>
          {error.includes('API key') && <span className="text-mute">— check Config panel</span>}
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full bg-primary text-on-primary font-semibold text-base rounded-xl px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-primary-active transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Analysing...
          </>
        ) : (
          'Generate Architecture'
        )}
      </button>
      <p className="text-xs text-mute mt-2 text-center">Ctrl+Enter to generate</p>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/FeatureInput.jsx
git commit -m "feat: add FeatureInput component with presets and Generate button"
```

---

## Task 10: StackDiagram Component

**Files:**
- Create: `src/components/StackDiagram.jsx`

- [ ] **Step 1: Write component**

Create `src/components/StackDiagram.jsx`:

```jsx
import { useAppStore } from '../store/useAppStore'

const LAYER_KEYWORDS = {
  Frontend: ['ui', 'dashboard', 'portal', 'frontend', 'page', 'view', 'screen', 'form', 'modal'],
  Backend: ['api', 'service', 'controller', 'handler', 'auth', 'queue', 'job', 'worker', 'webhook'],
  Database: ['database', 'db', 'storage', 'cache', 'redis', 'sql', 'mongo', 'repository'],
  Integration: ['salesforce', 'stripe', 'payment', 'email', 'sms', 'graphql', 'rest', 'webhook'],
}

function inferLayers(nodes) {
  const found = new Set()
  for (const node of nodes) {
    const text = (node.label + ' ' + node.pattern + ' ' + node.dataFlow).toLowerCase()
    for (const [layer, keywords] of Object.entries(LAYER_KEYWORDS)) {
      if (keywords.some((kw) => text.includes(kw))) found.add(layer)
    }
  }
  return [...found]
}

export default function StackDiagram() {
  const graph = useAppStore((s) => s.graph)
  if (!graph) return null

  const layers = inferLayers(graph.nodes)

  return (
    <div className="bg-canvas-soft rounded-xl p-6">
      <h2 className="text-xl font-black text-ink mb-4">Inferred Stack</h2>
      <div className="flex flex-wrap gap-3">
        {layers.map((layer) => (
          <span
            key={layer}
            className="px-3 py-1 rounded-pill text-sm font-semibold bg-primary-pale text-positive-deep"
          >
            {layer}
          </span>
        ))}
        {layers.length === 0 && (
          <span className="text-sm text-mute">No stack layers inferred.</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StackDiagram.jsx
git commit -m "feat: add StackDiagram component with keyword-based layer inference"
```

---

## Task 11: GraphCanvas Component

**Files:**
- Create: `src/components/GraphCanvas.jsx`

- [ ] **Step 1: Add React Flow CSS to main.jsx**

Open `src/main.jsx` and add the React Flow stylesheet import:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 2: Write custom node**

Create `src/components/GraphCanvas.jsx`:

```jsx
import { useCallback } from 'react'
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
  const { nodes: initialNodes, edges: initialEdges } = useGraphLayout()

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

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
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/GraphCanvas.jsx src/main.jsx
git commit -m "feat: add GraphCanvas with React Flow, custom FamNode, risk dots"
```

---

## Task 12: NodeDetail Component

**Files:**
- Create: `src/components/NodeDetail.jsx`

- [ ] **Step 1: Write component**

Create `src/components/NodeDetail.jsx`:

```jsx
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const TABS = ['Dev', 'EA', 'SA']

const RISK_STYLES = {
  low: 'bg-primary-pale text-positive-deep',
  medium: 'bg-warning text-warning-content',
  high: 'bg-negative-bg text-canvas',
}

export default function NodeDetail() {
  const graph = useAppStore((s) => s.graph)
  const selectedNodeId = useAppStore((s) => s.selectedNodeId)
  const [activeTab, setActiveTab] = useState('Dev')
  const [copied, setCopied] = useState(false)

  if (!graph || !selectedNodeId) return null

  const node = graph.nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  function copyPrompt() {
    navigator.clipboard.writeText(node.agentPrompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-canvas-soft rounded-xl p-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-ink">{node.label}</h2>
          <p className="text-sm text-body mt-1">{node.pattern}</p>
        </div>
        <span className={`px-3 py-1 rounded-pill text-sm font-semibold shrink-0 ${RISK_STYLES[node.riskLevel]}`}>
          {node.riskLevel} risk
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-primary text-on-primary'
                : 'bg-canvas text-ink hover:bg-primary-pale'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Dev' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Data Flow</p>
            <p className="text-sm text-body">{node.dataFlow}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Folder Structure</p>
            <pre className="text-xs bg-canvas border border-mute rounded-xl p-3 overflow-x-auto text-ink font-mono">
              {node.folderStructure}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-mute uppercase tracking-wide">Agent Prompt</p>
              <button
                onClick={copyPrompt}
                className="text-xs font-semibold px-3 py-1 rounded-pill bg-primary text-on-primary hover:bg-primary-active transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs bg-canvas border border-mute rounded-xl p-3 overflow-x-auto text-ink font-mono whitespace-pre-wrap">
              {node.agentPrompt}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'EA' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-2">NFR Tags</p>
            <div className="flex flex-wrap gap-2">
              {node.nfrTags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-pill text-sm font-semibold bg-primary-pale text-positive-deep">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Dependencies</p>
            {node.dependencies.length > 0 ? (
              <ul className="text-sm text-body space-y-1 list-disc list-inside">
                {node.dependencies.map((dep) => <li key={dep}>{dep}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-mute">No dependencies.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'SA' && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Business Reason</p>
            <p className="text-sm text-body">{node.businessReason}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Effort Estimate</p>
            <p className="text-sm text-body">{node.effortEstimate}</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/NodeDetail.jsx
git commit -m "feat: add NodeDetail with Dev/EA/SA tabs and copy agent prompt"
```

---

## Task 13: ExportPanel Component

**Files:**
- Create: `src/components/ExportPanel.jsx`

- [ ] **Step 1: Write component**

Create `src/components/ExportPanel.jsx`:

```jsx
import { useAppStore } from '../store/useAppStore'
import { toJSON, toMarkdown, toScaffold, toPrompts } from '../lib/exporters'

const EXPORTS = [
  { label: 'Export JSON', fn: toJSON },
  { label: 'Export Markdown', fn: toMarkdown },
  { label: 'Export Scaffold', fn: toScaffold },
  { label: 'Export Agent Prompts', fn: toPrompts },
]

export default function ExportPanel() {
  const graph = useAppStore((s) => s.graph)
  if (!graph) return null

  return (
    <div className="bg-canvas rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-black text-ink mb-4">Export</h2>
      <div className="flex flex-wrap gap-3">
        {EXPORTS.map(({ label, fn }) => (
          <button
            key={label}
            onClick={() => fn(graph)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-canvas-soft text-ink border border-mute hover:bg-primary-pale hover:border-primary transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ExportPanel.jsx
git commit -m "feat: add ExportPanel component"
```

---

## Task 14: App Layout

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Wire all components into App**

Replace `src/App.jsx` with:

```jsx
import './index.css'
import ConfigPanel from './components/ConfigPanel'
import FeatureInput from './components/FeatureInput'
import StackDiagram from './components/StackDiagram'
import GraphCanvas from './components/GraphCanvas'
import NodeDetail from './components/NodeDetail'
import ExportPanel from './components/ExportPanel'

export default function App() {
  return (
    <div className="min-h-screen bg-canvas-soft">
      {/* Nav */}
      <nav className="bg-canvas sticky top-0 z-20 px-6 py-4 flex items-center justify-between border-b border-canvas-soft">
        <div>
          <span className="text-base font-black text-ink">FAM</span>
          <span className="text-xs text-mute ml-2 hidden sm:inline">Feature Architecture Map</span>
        </div>
        <span className="text-xs text-mute italic">Plan the blueprint. Then build.</span>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-5xl font-black text-ink leading-none mb-2">Feature Architecture Map</h1>
          <p className="text-base text-body">Transform a feature list into a structured visual architecture.</p>
        </div>

        <ConfigPanel />
        <FeatureInput />
        <StackDiagram />
        <GraphCanvas />
        <NodeDetail />
        <ExportPanel />
      </main>

      <footer className="bg-ink text-canvas-soft text-sm px-6 py-8 mt-12 text-center">
        <p className="font-semibold">Nama Digital</p>
        <p className="text-mute mt-1">Plan the blueprint. Then build.</p>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Run dev server and verify full layout**

```bash
npm run dev
```

Open browser. Verify:
- Sage background
- Nav bar at top (white, sticky)
- ConfigPanel card visible (API key input, model toggle, integrations)
- FeatureInput card visible (textarea, preset pills, lime-green Generate button)
- GraphCanvas shows empty state with centered icon
- Footer visible at bottom

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire all components into App layout"
```

---

## Task 15: End-to-End Smoke Test

- [ ] **Step 1: Open dev server**

```bash
npm run dev
```

- [ ] **Step 2: Configure and generate**

1. Enter a real DeepSeek API key in ConfigPanel
2. Select model (Flash or Pro)
3. Click preset "SaaS App" to populate features
4. Click "Generate Architecture"
5. Verify: button shows spinner, then graph renders with nodes and risk dots

- [ ] **Step 3: Test interactions**

1. Click a node → NodeDetail appears below graph
2. Click Dev tab → see pattern, folder structure, agent prompt
3. Click EA tab → see NFR tags, dependencies
4. Click SA tab → see business reason, effort estimate
5. Click Copy button → clipboard updated, shows "Copied!" for 2s
6. Click same node again → NodeDetail collapses

- [ ] **Step 4: Test exports**

1. Click "Export JSON" → `fam-export.json` downloads
2. Click "Export Markdown" → `fam-architecture.md` downloads
3. Click "Export Scaffold" → `scaffold.txt` downloads
4. Click "Export Agent Prompts" → `agent-prompts.txt` downloads

- [ ] **Step 5: Test error state**

1. Clear API key
2. Click Generate
3. Verify: error badge appears with "API key is required" message

- [ ] **Step 6: Build for production**

```bash
npm run build
```

Expected: `dist/` folder created. No build errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: verify end-to-end smoke test passes"
```

---

## Task 16: GitHub Repo + Netlify CI/CD

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create nama-digital/fam --public --source=. --remote=origin --push
```

If `gh` not installed: create repo at github.com, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/fam.git
git push -u origin main
```

- [ ] **Step 2: Create Netlify site**

Go to app.netlify.com → "Add new site" → "Deploy manually" (to get a site ID first without linking yet).  
Or via CLI:

```bash
npx netlify-cli sites:create --name fam-nama-digital
```

Copy the **Site ID** from output.

- [ ] **Step 3: Get Netlify auth token**

Go to app.netlify.com → User Settings → Applications → Personal access tokens → New token.  
Copy the token.

- [ ] **Step 4: Add GitHub Secrets**

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret.

Add:
- `NETLIFY_AUTH_TOKEN` → paste your Netlify token
- `NETLIFY_SITE_ID` → paste your Netlify site ID

- [ ] **Step 5: Create deploy workflow**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Netlify
        run: npx netlify-cli deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

- [ ] **Step 6: Push and verify deploy**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add Netlify deploy workflow"
git push origin main
```

Go to GitHub → Actions tab. Watch the deploy job. On success, visit the Netlify URL from the job logs.

---

## Self-Review Checklist

- [x] Config panel (API key, model selector, integrations) → Task 8
- [x] Feature input (textarea, presets, Enter-to-submit) → Task 9
- [x] AI architecture analysis (DeepSeek, pattern/risk/NFR/dataflow) → Tasks 4, 5
- [x] Stack inference + visualization → Task 10
- [x] Force-directed graph (React Flow, drag, click) → Tasks 6, 11
- [x] Node detail Dev tab (pattern, folder, agent prompt, copy) → Task 12
- [x] Node detail EA tab (risk, NFR, dependencies) → Task 12
- [x] Node detail SA tab (business reason, effort, integration) → Task 12
- [x] Export JSON → Task 7, 13
- [x] Export Markdown → Task 7, 13
- [x] Export Folder Scaffold → Task 7, 13
- [x] Export Agent Prompts → Task 7, 13
- [x] Risk dots on nodes (green/yellow/red) → Tasks 6, 11
- [x] Loading states (spinner, disabled button) → Task 9
- [x] Error states (badge-negative pill) → Task 9
- [x] Empty graph state (centered icon) → Task 11
- [x] Wise design system (tokens, palette, radius, Inter) → Tasks 1, 8–14
- [x] localStorage persistence (apiKey, model) → Task 2
- [x] GitHub repo → Task 16
- [x] Netlify CI/CD → Task 16
- [x] Node > 15 warning badge → Task 11

# FAM — Feature Architecture Map: Design Spec

**Date:** 2026-05-23  
**Owner:** Ahmad Najwan — Nama Digital  
**Status:** Approved  

---

## 1. Overview

FAM is an AI-powered web tool. User inputs a plain-text feature list. DeepSeek infers design patterns, data flows, tech stack, risk levels, NFR tags, and business reasons. Results render as a force-directed graph with three lens views: Developer, Enterprise Architect, Solution Architect.

Built with Vite + React 18. Hosted on Netlify. Source on GitHub. Styled with the Wise design system.

---

## 2. Approach

Feature-sliced component tree with custom hooks (Approach B). State in Zustand. AI calls isolated behind `useAIAnalysis` hook. Export logic in pure functions. Each component has one clear responsibility.

---

## 3. File Structure

```
fam/
├── src/
│   ├── store/
│   │   └── useAppStore.js          # Zustand: config, features, graph, selectedNodeId
│   ├── hooks/
│   │   ├── useAIAnalysis.js        # DeepSeek API call, schema validation, store write
│   │   └── useGraphLayout.js       # React Flow nodes/edges derived from graph store
│   ├── components/
│   │   ├── ConfigPanel.jsx         # API key input, model selector, integration toggles
│   │   ├── FeatureInput.jsx        # Textarea, preset pills, Generate button
│   │   ├── StackDiagram.jsx        # Tech layer badges from AI output
│   │   ├── GraphCanvas.jsx         # React Flow wrapper, risk-dot custom nodes
│   │   ├── NodeDetail.jsx          # Dev / EA / SA tabs, copy agent prompt
│   │   └── ExportPanel.jsx         # JSON / Markdown / Scaffold / Agent Prompts buttons
│   ├── lib/
│   │   ├── deepseek.js             # API client, model param, prompt builder
│   │   ├── exporters.js            # Pure fns: toJSON, toMarkdown, toScaffold, toPrompts
│   │   └── schema.js               # JSON schema validator for AI output
│   ├── App.jsx                     # Vertical layout, section order
│   └── main.jsx
├── .github/
│   └── workflows/
│       └── deploy.yml              # Netlify deploy on push to main
├── .env.example
├── vite.config.js
└── package.json
```

---

## 4. State Management

Zustand store shape:

```js
{
  config: {
    apiKey: string,        // synced to localStorage
    model: 'deepseek-v4-flash' | 'deepseek-v4-pro',  // synced to localStorage
    integrations: string[] // selected integration toggles
  },
  features: string,        // raw user input
  graph: {
    nodes: Node[],
    edges: Edge[]
  } | null,
  selectedNodeId: string | null,
  loading: boolean,
  error: string | null
}
```

Only hooks write to store. Components read via selectors.

---

## 5. AI Layer

### API Client (`lib/deepseek.js`)

- Endpoint: `https://api.deepseek.com/chat/completions`
- Auth: `Authorization: Bearer {apiKey}` from store
- Model: `deepseek-v4-flash` (Fast) or `deepseek-v4-pro` (Best)
- Max tokens: 2000

### Prompt Structure

```
System: You are an expert software architect. Return ONLY valid JSON matching the schema provided.

User: Feature list: {features}
      Integrations: {integrations}
      Output schema: {schema}
```

### Output Schema (validated in `lib/schema.js`)

```json
{
  "nodes": [{
    "id": "string",
    "label": "string",
    "pattern": "string",
    "dataFlow": "string",
    "riskLevel": "low | medium | high",
    "nfrTags": ["string"],
    "folderStructure": "string",
    "businessReason": "string",
    "effortEstimate": "string",
    "agentPrompt": "string",
    "dependencies": ["string"]
  }],
  "edges": [{
    "source": "string",
    "target": "string",
    "label": "string"
  }]
}
```

### `useAIAnalysis` Hook Flow

1. Set `loading: true`, clear `error`
2. Call `deepseek.js` with current config + features
3. Parse JSON from response
4. Validate against schema
5. On success → write `graph` to store, `loading: false`
6. On failure → write `error` message, `loading: false`

---

## 6. Graph

**Library:** React Flow  
**Custom node:** renders label + risk dot (green/yellow/red based on `riskLevel`)  
**Risk colour mapping:**
- `low` → Wise Green `#9fe870`
- `medium` → Warning Yellow `#ffd11a`
- `high` → Negative Red `#d03238`

**Interactions:**
- Click node → set `selectedNodeId`, expand NodeDetail below graph
- Click same node → clear `selectedNodeId`, collapse NodeDetail
- Drag node → React Flow handles, manual position persists in session
- Graph warns user (badge) when node count > 15

---

## 7. UI Design (Wise Design System)

**Palette:**
- Page bg: `canvas-soft` `#e8ebe6`
- Cards: `canvas` `#ffffff`
- Primary CTA: `primary` `#9fe870` / `on-primary` `#0e0f0c`
- Body text: `ink` `#0e0f0c`
- Muted: `mute` `#868685`
- Warning: `#ffd11a` | Error: `#d03238`

**Typography:** Inter throughout. Display headings weight 900, body weight 400, labels/buttons weight 600.

**Radius:** `rounded-xl` 24px for all cards and buttons. `rounded-pill` for badges/status pills.

**Page layout (top to bottom):**

| # | Component | Wise surface |
|---|-----------|-------------|
| 1 | NavBar | `canvas` white sticky |
| 2 | ConfigPanel | `card-content` white |
| 3 | FeatureInput | `card-content` white |
| 4 | StackDiagram | `card-feature-sage` (hidden until first generate) |
| 5 | GraphCanvas | `card-content` white |
| 6 | NodeDetail | `card-feature-sage` (shown on node click) |
| 7 | ExportPanel | `card-content` white (hidden until graph exists) |

**States:**
- Empty graph: centered muted icon + instruction text inside GraphCanvas
- Loading: Generate button disabled + spinner
- Error: `badge-negative` pill with message + "Check your API key" hint

---

## 8. Components

### ConfigPanel
- API key: `text-input` password type
- Model: two-option segmented control — "Fast (V4 Flash)" / "Best (V4 Pro)"
- Integrations: checkbox group (e.g. Salesforce, REST, GraphQL, DB)
- All values write to Zustand + localStorage on change

### FeatureInput
- Large textarea (`text-input` style, multi-line)
- Preset pills: example feature sets as `button-secondary` pills
- Generate: `button-primary` lime-green, full-width, disabled during loading

### StackDiagram
- Reads inferred tech stack from graph nodes
- Renders horizontal layer badges grouped by: Frontend / Backend / Database / Integration
- Badge style: `badge-positive` for known stack, `badge-negative` for unknown/risk

### GraphCanvas
- React Flow with custom node component
- Custom node: rounded white card + label + risk dot (coloured circle top-right)
- Controls: React Flow's MiniMap + Controls panel
- Warning badge if node count > 15

### NodeDetail
- Three tabs: Dev / EA / SA (`button-secondary` tab style, active = `button-primary`)
- **Dev tab:** Pattern, Folder Structure (monospace), Agent Prompt (copy button)
- **EA tab:** Risk level badge, NFR tags, Dependencies list, EA note
- **SA tab:** Business Reason, Effort Estimate, Integration touchpoints
- Copy button: copies agent prompt to clipboard, shows "Copied!" for 2s

### ExportPanel
- 4 `button-secondary` buttons: Export JSON / Export Markdown / Export Scaffold / Export Agent Prompts
- All call pure functions from `lib/exporters.js` + `file-saver`

---

## 9. Exports (`lib/exporters.js`)

| Export | Output file | Content |
|--------|------------|---------|
| `toJSON` | `fam-export.json` | Raw graph object |
| `toMarkdown` | `fam-architecture.md` | Per-node sections: pattern, risk, NFR, business reason, effort |
| `toScaffold` | `scaffold.txt` | `folderStructure` per node, labelled |
| `toPrompts` | `agent-prompts.txt` | All `agentPrompt` fields, labelled per feature |

All use `file-saver` `saveAs`. No backend required.

---

## 10. GitHub & Deployment

**Repo structure:** `main` = production. Feature branches per PRD phase.

**`.github/workflows/deploy.yml`:**
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
      - run: npm ci
      - run: npm run build
      - run: npx netlify-cli deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**`.env.example`:**
```
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
```

API key is runtime user-supplied. Never in env files or source.

---

## 11. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| State | Zustand |
| Graph | React Flow |
| AI | DeepSeek API (deepseek-v4-flash / deepseek-v4-pro) |
| Styling | Tailwind CSS + Wise design tokens |
| Export | file-saver |
| Hosting | Netlify |
| CI/CD | GitHub Actions |

---

## 12. Out of Scope (v1)

- Multi-user / share links
- Persistent session history
- Conflict detection
- Effort heatmap
- Salesforce/Apex pattern library
- GitHub repo scaffolding integration

---

*Nama Digital · Plan the blueprint. Then build.*

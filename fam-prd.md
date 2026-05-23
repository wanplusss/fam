**NAMA DIGITAL**

**Feature Architecture Map**

Product Requirements Document

v1.0 · May 2026

| **Product**  | Feature Architecture Map (FAM)                      |
| ------------ | --------------------------------------------------- |
| **Owner**    | Ahmad Najwan - Nama Digital                         |
| **Version**  | 1.0                                                 |
| **Status**   | Draft - for review                                  |
| **Date**     | May 2026                                            |
| **Audience** | Developer, Enterprise Architect, Solution Architect |

# **1\. Overview**

## **1.1 Product summary**

Feature Architecture Map (FAM) is an AI-powered web tool that transforms a plain-text list of app features into a structured visual architecture. It infers design patterns, data flows, technology stack, business requirements, risk levels, and NFR tags - then presents the results through three lens views: Developer, Enterprise Architect, and Solution Architect.

FAM was designed as a pre-coding ritual under the Nama Digital builder brand. The goal is to enforce architecture-first thinking before a single line of code is written - especially when working with coding agents that need clear structural guardrails.

## **1.2 Problem statement**

| **Problem** | Developers and solo builders jump straight to implementation without mapping architecture first. Coding agents amplify this - they produce working but structurally inconsistent code when given loose prompts. There is no lightweight tool for indie builders to plan architecture visually before building. |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

Current alternatives are either too heavy (enterprise architecture tools like EA Sparx, LeanIX) or too simple (basic mindmaps, whiteboards). FAM fills the gap for solo builders and small teams.

## **1.3 Vision**

Every app built under Nama Digital starts with a FAM session. Eventually, FAM becomes a product offering - an architecture consultancy session wrapped in a tool - that Nama Digital delivers to clients before any build engagement begins.

| **Tagline** | Plan the blueprint. Then build. |
| ----------- | ------------------------------- |

# **2\. Goals & success metrics**

## **2.1 Primary goals**

- Force architecture thinking before implementation
- Produce pattern-aware, copy-paste ready agent prompts per feature
- Serve three audiences (Dev / EA / SA) from one interface
- Export usable artifacts: JSON, Markdown doc, folder scaffold, agent prompts

## **2.2 Non-goals**

- Not a full EA tool - no TOGAF compliance, no enterprise integration registry
- Not a project management tool - no tickets, no timelines
- Not a code generator - FAM informs agents, it does not replace them
- Not a collaboration platform (v1) - single-user, no real-time sync

## **2.3 Success metrics**

| **Metric**                    | **Target**                                                    |
| ----------------------------- | ------------------------------------------------------------- |
| Architecture sessions created | \> 50 sessions in first 3 months (personal + client use)      |
| Export usage                  | \> 70% of sessions export at least one artifact               |
| Agent prompt usage            | Users report prompts reduce architecture ambiguity            |
| Time-to-architecture          | < 3 minutes from feature input to complete graph              |
| Pattern accuracy              | AI suggests correct pattern > 80% of the time (user feedback) |

# **3\. User personas**

## **3.1 Developer (Primary)**

Solo builder or engineer who works with coding agents. Needs structural guardrails before starting a feature. Wants copy-paste prompts and a clear folder structure so the agent produces consistent, extensible code.

- Key need: pattern per feature, agent prompt, folder scaffold
- Pain: agents produce spaghetti code without architecture context
- Behaviour: builds fast, iterates often, ships solo

## **3.2 Enterprise Architect (Secondary)**

Experienced architect at a corporate organisation (e.g. PETRONAS). Uses FAM to communicate architecture decisions visually. Cares about system-wide coherence, risk mapping, NFR tagging, and integration touchpoints.

- Key need: risk flagging, NFR tags, dependency view, EA note per feature
- Pain: no lightweight tool that bridges technical and business concerns
- Behaviour: plans before builds, governs architecture decisions

## **3.3 Solution Architect (Secondary)**

Consultant or technical lead who translates business requirements into system design. Uses FAM in pre-engagement sessions to establish architecture before a dev team is brought in.

- Key need: business requirement traceability, complexity signal, effort estimation
- Pain: gaps between business intent and technical implementation
- Behaviour: facilitates architecture workshops, produces handoff documents

# **4\. Features & requirements**

## **4.1 Core features - v1.0**

| **Feature**                     | **Priority** | **Effort** | **Notes**                                          |
| ------------------------------- | ------------ | ---------- | -------------------------------------------------- |
| Config panel                    | P0           | 0.5 day    | API key, model selector, integration toggles       |
| Feature input                   | P0           | 0.5 day    | Free text, example presets, Enter to submit        |
| AI architecture analysis        | P0           | 2 days     | Pattern, data flow, risk, NFR, business reason     |
| Stack inference + visualization | P0           | 1 day      | Layer diagram + tech badges from feature text      |
| Force-directed graph            | P0           | 2 days     | Nodes, edges, drag to reposition, click to expand  |
| Node detail - Dev tab           | P0           | 1 day      | Pattern, folder structure, agent prompt (copyable) |
| Node detail - EA tab            | P0           | 1 day      | Risk, NFR tags, dependencies, EA note              |
| Node detail - SA tab            | P0           | 1 day      | Business reason, effort estimate, integration      |
| Export - JSON                   | P0           | 0.5 day    | Full graph data as downloadable JSON               |
| Export - Markdown doc           | P0           | 0.5 day    | Architecture document for handoff                  |
| Export - Folder scaffold        | P1           | 0.5 day    | Plaintext folder paths per feature                 |
| Export - Agent prompts          | P1           | 0.5 day    | All prompts in one downloadable file               |
| Risk dot on nodes               | P1           | 0.5 day    | Colour-coded dot (red/amber/green) per node        |

## **4.2 Future features - v2.0**

| **Feature**                | **Priority** | **Effort** | **Notes**                                         |
| -------------------------- | ------------ | ---------- | ------------------------------------------------- |
| Conflict detection         | P2           | 2 days     | Flag features sharing a data source without cache |
| Effort heatmap             | P2           | 1 day      | Visual complexity overlay on graph                |
| Multi-user / share link    | P2           | 3 days     | Read-only shareable URL per session               |
| Persistent history         | P2           | 2 days     | Save and reload past sessions                     |
| Salesforce / Apex patterns | P3           | 2 days     | PETRONAS / enterprise-specific pattern library    |
| Client session mode        | P3           | 3 days     | Facilitated architecture workshop flow            |

# **5\. Technical architecture**

## **5.1 Technology stack**

| **Layer**   | **Technology**           | **Rationale**                                 |
| ----------- | ------------------------ | --------------------------------------------- |
| Frontend    | React 18 + Vite          | Fast HMR, JSX, broad ecosystem                |
| State/Logic | Zustand / React Query    | Lightweight state + server state separation   |
| Graph       | React Flow               | Purpose-built force-directed graph library    |
| AI Layer    | Anthropic Claude API     | Pattern analysis, stack inference, prompt gen |
| Styling     | CSS Variables + Tailwind | Theme-aware, responsive, dark mode ready      |
| Export      | File Saver + js-yaml     | JSON, Markdown, TXT export without backend    |
| Hosting     | Vercel / Netlify         | Zero-config, CDN, preview URLs per branch     |

## **5.2 AI analysis pipeline**

Each generate call sends a structured prompt to Claude API containing: feature list, selected integrations, and output schema. The model returns a JSON graph with nodes and edges - each node carrying pattern, data flow, risk level, NFR tags, folder structure, business reason, and a copy-paste agent prompt.

- Model: claude-sonnet-4 (default), claude-haiku-4 (fast mode)
- Max tokens: 2000 per request
- Output: strict JSON schema - validated on client before render
- API key: user-supplied, stored in component state only - never persisted

## **5.3 Graph layout**

Force-directed simulation using custom hook. Repulsion between all nodes, attraction along edges, center gravity. Simulation runs for 400 ticks then stabilises. Nodes are draggable post-simulation - manual positions override simulated positions.

## **5.4 Design patterns used in FAM itself**

- Custom hook (useForceDirected) - separation of simulation logic from render
- Component composition - Section, Badge, DetailCard, NodeDetail as independent units
- Unidirectional data flow - graph state owned at root, passed down as props
- Pure export functions - no side effects beyond file download trigger

# **6\. UX & design**

## **6.1 Layout**

Single-page vertical layout. Sections are collapsible. No routing. Config → Input → Stack → Graph → Node Detail → Export flows top to bottom. Node detail appears inline below the graph on click.

## **6.2 Aesthetic**

Dark-mode only. IBM Plex Mono for primary font - reinforces the technical, builder identity. Deep navy backgrounds (#030712) with blue and purple accent strokes. Risk communicated through colour-coded dots on graph nodes.

## **6.3 Interaction model**

- Enter key submits feature input
- Click node → expands detail inline, highlights node with glow
- Click same node again → collapses detail
- Drag node → repositions on graph, manual position persists
- Tab switch → preserves scroll position
- Copy button → copies agent prompt to clipboard, shows confirmation

## **6.4 Empty and loading states**

- Empty graph: centered icon with instruction text
- Loading: spinning icon on button, button disabled during request
- Error: alert with message + hint to check API key

# **7\. Constraints & risks**

| **Constraint / Risk** | **Severity** | **Mitigation**                                                                        |
| --------------------- | ------------ | ------------------------------------------------------------------------------------- |
| Browser-only API call | Medium       | Requires CORS proxy or server middleware for production. Development uses Vite proxy. |
| API key exposure      | High         | Key stored in React state only, never in localStorage or URL. Docs warn users.        |
| AI JSON parsing       | Medium       | Strict try/catch with user-friendly error. Schema validated before render.            |
| Large feature lists   | Low          | Graph layout degrades past ~20 nodes. Warn user at > 15 features.                     |
| Pattern accuracy      | Medium       | AI suggestions may be incorrect. Node detail shows reasoning so user can override.    |
| Single user only (v1) | Low          | Multi-user deferred to v2. Session data in component state only.                      |

# **8\. Release roadmap**

## **Phase 1 - MVP (Week 1-2)**

- Config panel, feature input, AI analysis
- Force-directed graph with risk dots
- Node detail with Dev / EA / SA tabs
- Stack layer diagram
- JSON and Markdown export

## **Phase 2 - Polish (Week 3-4)**

- Folder scaffold and agent prompt export
- Error handling, loading states, empty states
- Responsive layout (tablet support)
- Performance optimisation for large graphs
- Deploy to Vercel under nama.digital domain

## **Phase 3 - Growth (Month 2-3)**

- Conflict detection and NFR warning flags
- Effort heatmap overlay
- Persistent sessions (localStorage)
- Share link (read-only URL export)
- Salesforce / Apex pattern library for PETRONAS use case

# **9\. Open questions**

- Should FAM support multiple graphs per session, or one graph per session?
- What is the monetisation model - freemium, per-session credits, or free forever under Nama Digital brand?
- Should agent prompts be customisable by stack (Flutter / React / Salesforce Apex)?
- Is there a market for a facilitated FAM session as a paid architecture workshop?
- Should FAM eventually integrate with GitHub to scaffold the folder structure directly into a repo?

_Nama Digital · Plan the blueprint. Then build._
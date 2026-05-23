import { create } from 'zustand'

const STORAGE_KEY_API = 'fam_api_key'
const STORAGE_KEY_MODEL = 'fam_model'
const STORAGE_KEY_DARK = 'fam_dark'

export const useAppStore = create((set) => ({
  config: {
    apiKey: localStorage.getItem(STORAGE_KEY_API) ?? '',
    model: localStorage.getItem(STORAGE_KEY_MODEL) ?? 'deepseek-v4-flash',
    integrations: [],
  },
  features: '',
  graph: null,
  aiRaw: null,
  nodeReviews: {},  // { [nodeId]: { loading, review, error } }
  nodeDepths: {},   // { [nodeId]: { loading, depth, error } }
  selectedNodeId: null,
  loading: false,
  error: null,
  darkMode: localStorage.getItem(STORAGE_KEY_DARK) === 'true',
  mergeMode: false,

  setConfig: (partial) =>
    set((state) => {
      const next = { ...state.config, ...partial }
      if (partial.apiKey !== undefined) localStorage.setItem(STORAGE_KEY_API, partial.apiKey)
      if (partial.model !== undefined) localStorage.setItem(STORAGE_KEY_MODEL, partial.model)
      return { config: next }
    }),

  setFeatures: (features) => set({ features }),

  setGraph: (graph) => set({ graph, error: null }),

  mergeGraph: (incoming) =>
    set((state) => {
      if (!state.graph) return { graph: incoming, error: null }
      const existingIds = new Set(state.graph.nodes.map((n) => n.id))
      const newNodes = incoming.nodes.filter((n) => !existingIds.has(n.id))
      const existingEdgeKeys = new Set(
        state.graph.edges.map((e) => `${e.source}->${e.target}`)
      )
      const newEdges = incoming.edges.filter(
        (e) => !existingEdgeKeys.has(`${e.source}->${e.target}`)
      )
      return {
        graph: {
          nodes: [...state.graph.nodes, ...newNodes],
          edges: [...state.graph.edges, ...newEdges],
        },
        error: null,
      }
    }),

  setAiRaw: (aiRaw) => set({ aiRaw }),

  setNodeReview: (nodeId, patch) =>
    set((state) => ({
      nodeReviews: {
        ...state.nodeReviews,
        [nodeId]: { ...state.nodeReviews[nodeId], ...patch },
      },
    })),

  setNodeDepth: (nodeId, patch) =>
    set((state) => ({
      nodeDepths: {
        ...state.nodeDepths,
        [nodeId]: { ...state.nodeDepths[nodeId], ...patch },
      },
    })),

  patchNode: (nodeId, fields) =>
    set((state) => {
      if (!state.graph) return {}
      return {
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.map((n) =>
            n.id === nodeId ? { ...n, ...fields } : n
          ),
        },
      }
    }),

  setSelectedNodeId: (id) =>
    set((state) => ({ selectedNodeId: state.selectedNodeId === id ? null : id })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  clearError: () => set({ error: null }),

  toggleMergeMode: () => set((state) => ({ mergeMode: !state.mergeMode })),

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode
      localStorage.setItem(STORAGE_KEY_DARK, String(next))
      if (next) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      return { darkMode: next }
    }),
}))

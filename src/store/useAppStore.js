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
  selectedNodeId: null,
  loading: false,
  error: null,
  darkMode: localStorage.getItem(STORAGE_KEY_DARK) === 'true',

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

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode
      localStorage.setItem(STORAGE_KEY_DARK, String(next))
      if (next) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      return { darkMode: next }
    }),
}))

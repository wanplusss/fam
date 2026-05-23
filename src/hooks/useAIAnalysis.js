import { useAppStore } from '../store/useAppStore'
import { analyzeFeatures } from '../lib/deepseek'
import { validateGraph } from '../lib/schema'

export function useAIAnalysis() {
  const { config, features, setGraph, setAiRaw, setLoading, setError, clearError } = useAppStore()

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
      const { content, thinking } = await analyzeFeatures({
        apiKey: config.apiKey,
        model: config.model,
        features: features.trim(),
        integrations: config.integrations,
      })

      setAiRaw({ content, thinking })

      const result = validateGraph(content)
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

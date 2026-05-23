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
        placeholder={"List your app features, one per line\ne.g. User authentication\n     Dashboard with analytics\n     Payment integration"}
        rows={8}
        className="w-full border border-ink rounded-xl px-4 py-3 text-base text-ink bg-canvas focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
      />

      {error && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-negative-bg text-canvas text-sm font-semibold flex items-center gap-2">
          <span>⚠</span>
          <span>{error}</span>
          {(error.includes('API key') || error.includes('api key')) && (
            <span className="text-mute ml-1">— check Config panel</span>
          )}
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

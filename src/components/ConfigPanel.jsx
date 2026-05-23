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

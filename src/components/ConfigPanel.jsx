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
    <div className="bg-canvas dark:bg-zinc-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-black text-ink dark:text-white mb-4">Configuration</h2>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-ink dark:text-zinc-300 mb-1">DeepSeek API Key</label>
        <input
          type="password"
          value={config.apiKey}
          onChange={(e) => setConfig({ apiKey: e.target.value })}
          placeholder="sk-..."
          className="w-full border border-ink dark:border-zinc-600 rounded-xl px-4 py-3 text-base text-ink dark:text-white bg-canvas dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-ink dark:text-zinc-300 mb-2">Model</label>
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
                  : 'bg-canvas dark:bg-zinc-700 text-ink dark:text-zinc-300 border-ink dark:border-zinc-600 hover:bg-canvas-soft dark:hover:bg-zinc-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink dark:text-zinc-300 mb-2">Integrations</label>
        <div className="flex flex-wrap gap-2">
          {INTEGRATIONS.map((name) => (
            <button
              key={name}
              onClick={() => toggleIntegration(name)}
              className={`px-3 py-1 rounded-pill text-sm font-semibold border transition-colors ${
                config.integrations.includes(name)
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-canvas dark:bg-zinc-700 text-body dark:text-zinc-400 border-mute dark:border-zinc-600 hover:bg-canvas-soft dark:hover:bg-zinc-600'
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

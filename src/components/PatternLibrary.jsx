import { useState } from 'react'
import { PATTERN_LIBRARY, CATEGORIES } from '../lib/patternLibrary'

const ALL = 'all'

export default function PatternLibrary() {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState(ALL)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const filtered = PATTERN_LIBRARY.filter((p) => {
    const matchCat = filter === ALL || p.category === filter
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q) || p.when.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  function toggle(name) {
    setExpanded((prev) => (prev === name ? null : name))
  }

  return (
    <div className="bg-canvas dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-canvas-soft dark:hover:bg-zinc-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-ink dark:text-white">Pattern Library</h2>
          <span className="text-xs font-semibold text-mute dark:text-zinc-400 bg-canvas-soft dark:bg-zinc-700 px-2 py-0.5 rounded-pill">
            {PATTERN_LIBRARY.length} patterns
          </span>
        </div>
        <span className="text-mute text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4">
          {/* filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setFilter(ALL)}
              className={`px-3 py-1 rounded-pill text-xs font-semibold border transition-colors ${
                filter === ALL
                  ? 'bg-ink text-canvas border-ink dark:bg-white dark:text-zinc-900 dark:border-white'
                  : 'bg-canvas-soft dark:bg-zinc-700 text-mute dark:text-zinc-400 border-mute dark:border-zinc-600 hover:bg-primary-pale'
              }`}
            >
              All
            </button>
            {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 rounded-pill text-xs font-semibold border transition-colors ${
                  filter === key
                    ? color + ' border-transparent'
                    : 'bg-canvas-soft dark:bg-zinc-700 text-mute dark:text-zinc-400 border-mute dark:border-zinc-600 hover:bg-primary-pale'
                }`}
              >
                {label}
              </button>
            ))}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patterns…"
              className="ml-auto px-3 py-1 text-xs rounded-xl border border-mute dark:border-zinc-600 bg-canvas dark:bg-zinc-700 text-ink dark:text-white placeholder-mute dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary w-40"
            />
          </div>

          {/* pattern cards */}
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-sm text-mute py-4 text-center">No patterns match.</p>
            )}
            {filtered.map((p) => {
              const cat = CATEGORIES[p.category]
              const isOpen = expanded === p.name
              return (
                <div
                  key={p.name}
                  className="border border-mute dark:border-zinc-700 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggle(p.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-canvas-soft dark:hover:bg-zinc-700 transition-colors"
                  >
                    <span className={`shrink-0 px-2 py-0.5 rounded-pill text-xs font-bold ${cat.color}`}>
                      {cat.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ink dark:text-white">{p.name}</p>
                      <p className="text-xs text-mute dark:text-zinc-400 truncate">{p.tagline}</p>
                    </div>
                    <span className="text-mute text-xs shrink-0">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-mute dark:border-zinc-700 pt-3">
                      <Row label="Use when" value={p.when} color="text-positive-deep dark:text-green-400" />
                      <Row label="Don't use when" value={p.whenNot} color="text-negative dark:text-red-400" />
                      <Row label="Real-world example" value={p.example} color="text-body dark:text-zinc-300" />
                      <Row label="Trade-offs" value={p.tradeoffs} color="text-body dark:text-zinc-300" />
                      {p.pairedWith?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-1">Often paired with</p>
                          <div className="flex flex-wrap gap-1">
                            {p.pairedWith.map((name) => (
                              <button
                                key={name}
                                onClick={() => { setExpanded(name); setFilter(ALL); setSearch('') }}
                                className="px-2 py-0.5 rounded-pill text-xs font-semibold bg-canvas-soft dark:bg-zinc-700 text-ink dark:text-zinc-300 border border-mute dark:border-zinc-600 hover:bg-primary-pale transition-colors"
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, color }) {
  return (
    <div>
      <p className="text-xs font-semibold text-mute uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-xs ${color}`}>{value}</p>
    </div>
  )
}

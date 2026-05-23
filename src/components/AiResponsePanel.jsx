import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export default function AiResponsePanel() {
  const aiRaw = useAppStore((s) => s.aiRaw)
  const [showThinking, setShowThinking] = useState(false)
  const [showContent, setShowContent] = useState(false)

  if (!aiRaw) return null

  return (
    <div className="bg-canvas dark:bg-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-black text-ink dark:text-white">AI Response</h2>

      {aiRaw.thinking && (
        <div>
          <button
            onClick={() => setShowThinking((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-mute dark:text-zinc-400 hover:text-ink dark:hover:text-white transition-colors"
          >
            <span className={`transition-transform ${showThinking ? 'rotate-90' : ''}`}>▶</span>
            Thinking process ({aiRaw.thinking.length} chars)
          </button>
          {showThinking && (
            <pre className="mt-2 text-xs bg-canvas-soft dark:bg-zinc-900 border border-mute dark:border-zinc-700 rounded-xl p-4 overflow-x-auto text-body dark:text-zinc-400 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
              {aiRaw.thinking}
            </pre>
          )}
        </div>
      )}

      <div>
        <button
          onClick={() => setShowContent((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-mute dark:text-zinc-400 hover:text-ink dark:hover:text-white transition-colors"
        >
          <span className={`transition-transform ${showContent ? 'rotate-90' : ''}`}>▶</span>
          Raw JSON response ({aiRaw.content?.length ?? 0} chars)
        </button>
        {showContent && (
          <pre className="mt-2 text-xs bg-canvas-soft dark:bg-zinc-900 border border-mute dark:border-zinc-700 rounded-xl p-4 overflow-x-auto text-body dark:text-zinc-400 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
            {aiRaw.content}
          </pre>
        )}
      </div>
    </div>
  )
}

import { Play, Sparkles, Loader2 } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import FocusCard from './FocusCard.jsx'

// "Dein Fokus heute": die wichtigsten offenen Tasks.
// Standardmäßig nach Dringlichkeit sortiert; per "KI-Plan"-Knopf lässt du
// die Reihenfolge + Begründungen von der KI vorschlagen.
export default function FocusSection({
  tasks,
  summary,
  aiStatus,
  aiError,
  onGenerate,
  onStartFocus,
}) {
  const loading = aiStatus === 'loading'

  return (
    <section className="mb-10">
      <SectionTitle
        aside={
          tasks.length > 0 ? (
            <span className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={onGenerate}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-ink/30 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} className="text-area-study" />
                )}
                {loading ? 'Denkt …' : 'KI-Plan'}
              </button>
              <button
                type="button"
                onClick={onStartFocus}
                className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-medium text-canvas transition-transform active:scale-95"
              >
                <Play size={12} strokeWidth={2.5} />
                Fokus
              </button>
            </span>
          ) : null
        }
      >
        Dein Fokus heute
      </SectionTitle>

      {/* KI-Tagesüberblick, wenn vorhanden */}
      {summary && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-area-study" />
          <p>{summary}</p>
        </div>
      )}

      {aiError && (
        <p className="mb-3 text-sm text-red-500">KI: {aiError}</p>
      )}

      {tasks.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          Nichts Dringendes offen — schön! Neue Tasks erfasst du unten mit „+".
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {tasks.map((task) => (
            <FocusCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  )
}

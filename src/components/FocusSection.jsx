import { Play, Sparkles, Loader2, Coffee } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import FocusCard from './FocusCard.jsx'
import { SkeletonCard } from './Skeleton.jsx'
import { useCollapsible } from '../lib/useCollapsible.js'

// "Dein Fokus heute": die wichtigsten offenen Tasks.
// Standardmäßig nach Dringlichkeit sortiert; per "KI-Plan"-Knopf lässt du
// die Reihenfolge + Begründungen von der KI vorschlagen.
export default function FocusSection({
  tasks,
  loading,
  summary,
  aiStatus,
  aiError,
  onGenerate,
  onStartFocus,
}) {
  const aiLoading = aiStatus === 'loading'
  const { open, toggle } = useCollapsible('focus', true)

  if (loading) {
    return (
      <section className="mb-10">
        <SectionTitle>Dein Fokus heute</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    )
  }

  return (
    <section className="mb-10">
      <SectionTitle
        collapsible
        open={open}
        onToggle={toggle}
        aside={
          tasks.length > 0 ? (
            <span className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={onGenerate}
                disabled={aiLoading}
                className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-ink/30 disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} className="text-area-study" />
                )}
                {aiLoading ? 'Denkt …' : 'KI-Plan'}
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

      {open && (
        <>
          {/* KI-Tagesüberblick, wenn vorhanden */}
          {summary && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-area-study" />
              <p>{summary}</p>
            </div>
          )}

          {aiError && (
            <p className="mb-3 text-sm text-danger">KI: {aiError}</p>
          )}

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
              <Coffee size={20} />
              <p>Nichts Dringendes offen — schön! Neue Tasks erfasst du unten mit „+".</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {tasks.map((task) => (
                <FocusCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

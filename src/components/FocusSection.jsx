import { Play } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import FocusCard from './FocusCard.jsx'

// "Dein Fokus heute": die wichtigsten offenen Tasks, nach Dringlichkeit.
// `onStartFocus` startet den Fokus-Modus (nur sinnvoll, wenn es Tasks gibt).
export default function FocusSection({ tasks, onStartFocus }) {
  return (
    <section className="mb-10">
      <SectionTitle
        aside={
          tasks.length > 0 ? (
            <button
              type="button"
              onClick={onStartFocus}
              className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-medium text-white transition-transform active:scale-95"
            >
              <Play size={12} strokeWidth={2.5} />
              Fokus-Modus
            </button>
          ) : null
        }
      >
        Dein Fokus heute
      </SectionTitle>

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

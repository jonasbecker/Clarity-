import { Target } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import FocusCard from './FocusCard.jsx'

// "Dein Fokus heute": die wichtigsten offenen Tasks, nach Dringlichkeit.
// Bekommt bereits ausgewählte Tasks (siehe lib/focus.js).
export default function FocusSection({ tasks }) {
  return (
    <section className="mb-10">
      <SectionTitle
        aside={
          <span className="inline-flex items-center gap-1">
            <Target size={14} className="text-area-study" />
            Nach Dringlichkeit
          </span>
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

import { Sparkles } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import FocusCard from './FocusCard.jsx'

// "Dein Fokus heute": die 3 KI-vorgeschlagenen Top-Tasks.
// Mobile: gestapelt. Desktop: 3 Spalten nebeneinander.
export default function FocusSection({ tasks }) {
  return (
    <section className="mb-10">
      <SectionTitle
        aside={
          <span className="inline-flex items-center gap-1">
            <Sparkles size={14} className="text-area-study" />
            KI-Vorschlag
          </span>
        }
      >
        Dein Fokus heute
      </SectionTitle>
      <div className="grid gap-3 sm:grid-cols-3">
        {tasks.map((task) => (
          <FocusCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  )
}

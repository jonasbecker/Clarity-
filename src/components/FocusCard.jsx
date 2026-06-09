import { Clock } from 'lucide-react'
import { areas } from '../data/dummyData.js'

// Eine einzelne Karte aus "Dein Fokus heute".
// Bekommt einen `task` und stellt ihn mit dem Akzent seines Bereichs dar.
export default function FocusCard({ task }) {
  const area = areas[task.area]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Farbiger Akzent-Streifen links = Bereich */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: area.color }}
        aria-hidden="true"
      />
      <div className="pl-2">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: area.color }}
        >
          {area.label}
        </span>
        <h3 className="mt-1 font-medium leading-snug">{task.title}</h3>
        <p className="mt-1 text-sm text-ink-soft">{task.reason}</p>
        <div className="mt-3 inline-flex items-center gap-1 text-xs text-ink-soft">
          <Clock size={14} strokeWidth={2} />
          <span>{task.estimate}</span>
        </div>
      </div>
    </div>
  )
}

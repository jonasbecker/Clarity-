import { useState } from 'react'
import { Check } from 'lucide-react'
import { areas } from '../data/dummyData.js'

// Eine Task-Zeile mit abhakbarem Kreis.
// `useState` merkt sich lokal, ob die Task erledigt ist — rein visuell,
// es wird (noch) nichts gespeichert. So lernst du, wie State in React
// eine Komponente neu rendern lässt.
export default function TaskCard({ task }) {
  const [done, setDone] = useState(false)
  const area = areas[task.area]

  return (
    <div className="flex items-center gap-3 py-2.5">
      <button
        type="button"
        onClick={() => setDone((d) => !d)}
        aria-pressed={done}
        aria-label={done ? 'Als offen markieren' : 'Als erledigt markieren'}
        className="grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors"
        style={{
          borderColor: area.color,
          backgroundColor: done ? area.color : 'transparent',
        }}
      >
        {done && <Check size={12} strokeWidth={3} className="text-white" />}
      </button>

      <span
        className={`flex-1 text-sm leading-snug transition-colors ${
          done ? 'text-ink-soft line-through' : ''
        }`}
      >
        {task.title}
      </span>

      {task.due && (
        <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-xs text-ink-soft">
          {task.due}
        </span>
      )}
    </div>
  )
}

import { Check, Trash2 } from 'lucide-react'
import { areas } from '../data/dummyData.js'

// Eine Task-Zeile mit abhakbarem Kreis und Löschen-Knopf.
//
// Wichtige Änderung gegenüber vorher: die Karte hat KEINEN eigenen State
// mehr. Ob sie erledigt ist, steht in `task.done` (kommt aus der Datenbank).
// Beim Klick ruft sie nur onToggle/onDelete auf — die TodayView speichert
// die Änderung. So überlebt der Status das Neuladen der Seite.
export default function TaskCard({ task, onToggle, onDelete }) {
  const area = areas[task.area]
  const done = task.done

  return (
    <div className="group flex items-center gap-3 py-2.5">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
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

      {/* Löschen: dezent, erscheint beim Hovern (am Handy immer sichtbar) */}
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="Task löschen"
        className="shrink-0 text-ink-soft opacity-60 transition-opacity hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

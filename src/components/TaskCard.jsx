import { useState } from 'react'
import { Check, Repeat, Trash2 } from 'lucide-react'
import { areas } from '../data/dummyData.js'
import { formatDueLabel, isOverdue } from '../lib/date.js'

// Eine Task-Zeile: abhaken (Kreis), bearbeiten (Titel antippen), löschen.
// Zeigt optional Beschreibung (zweite Zeile) und Fälligkeit (Badge).
export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const area = areas[task.area]
  // Beim Abhaken erst kurz die Animation zeigen, dann erst in der echten
  // Liste ändern — sonst verschwindet die Karte, bevor man den "Pop" sieht.
  const [pending, setPending] = useState(false)
  const done = task.done || pending
  const dueLabel = formatDueLabel(task.due_date)
  const overdue = !done && isOverdue(task.due_date)

  function handleToggle() {
    if (pending) return
    if (!task.done) {
      setPending(true)
      setTimeout(() => onToggle(task.id), 220)
    } else {
      onToggle(task.id)
    }
  }

  return (
    <div className="group flex animate-task-in items-center gap-3 py-2.5">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={done}
        aria-label={done ? 'Als offen markieren' : 'Als erledigt markieren'}
        className={`mt-0.5 grid size-5 shrink-0 self-start place-items-center rounded-full border-2 transition-colors ${
          pending ? 'animate-check-pop' : ''
        }`}
        style={{
          borderColor: area.color,
          backgroundColor: done ? area.color : 'transparent',
        }}
      >
        {done && <Check size={12} strokeWidth={3} className="text-white" />}
      </button>

      {/* Titel (antippen → bearbeiten) + optionale Beschreibung */}
      <button
        type="button"
        onClick={() => onEdit(task)}
        className="min-w-0 flex-1 text-left"
      >
        <span
          className={`block text-sm leading-snug transition-colors hover:text-ink ${
            done ? 'text-ink-soft line-through' : ''
          }`}
        >
          {task.title}
        </span>
        {task.description && (
          <span className="mt-0.5 line-clamp-1 block text-xs text-ink-soft">
            {task.description}
          </span>
        )}
      </button>

      {task.repeat && (
        <span
          className="shrink-0 self-start pt-0.5 text-ink-soft"
          title={task.repeat === 'daily' ? 'Wiederholt sich täglich' : 'Wiederholt sich wöchentlich'}
        >
          <Repeat size={13} aria-hidden="true" />
          <span className="sr-only">
            Wiederholt sich {task.repeat === 'daily' ? 'täglich' : 'wöchentlich'}
          </span>
        </span>
      )}

      {dueLabel && (
        <span
          className={`shrink-0 self-start rounded-full px-2 py-0.5 text-xs ${
            overdue ? 'bg-danger-bg text-danger' : 'bg-canvas text-ink-soft'
          }`}
        >
          {dueLabel}
        </span>
      )}

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="Task löschen"
        className="shrink-0 self-start text-ink-soft opacity-60 transition-opacity hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

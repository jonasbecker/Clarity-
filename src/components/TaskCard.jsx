import { useState } from 'react'
import { Check, Repeat, Trash2, Flag, ListChecks, GripVertical } from 'lucide-react'
import { areas } from '../data/dummyData.js'
import { formatDueLabel, isOverdue } from '../lib/date.js'
import { subtaskProgress } from '../lib/subtasks.js'
import { repeatLabel } from '../lib/repeat.js'

// Eine Task-Zeile: abhaken (Kreis), bearbeiten (Titel antippen), löschen.
// Zeigt optional Beschreibung (zweite Zeile) und Fälligkeit (Badge).
//
// Per Drag & Drop (Desktop) lässt sich die Karte am Griff in eine andere
// Bereichs-Spalte ziehen; `onDragStart`/`onDragEnd`/`dragging` steuern das.
export default function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  dragging,
}) {
  const area = areas[task.area]
  // Beim Abhaken erst kurz die Animation zeigen, dann erst in der echten
  // Liste ändern — sonst verschwindet die Karte, bevor man den "Pop" sieht.
  const [pending, setPending] = useState(false)
  const done = task.done || pending
  const dueLabel = formatDueLabel(task.due_date)
  const overdue = !done && isOverdue(task.due_date)
  const highPriority = task.priority === 'high'
  const steps = subtaskProgress(task.subtasks)
  const tags = Array.isArray(task.tags) ? task.tags : []

  function handleToggle() {
    if (pending) return
    if (!task.done) {
      setPending(true)
      setTimeout(() => onToggle(task.id), 220)
    } else {
      onToggle(task.id)
    }
  }

  const draggable = Boolean(onDragStart)

  return (
    <div
      draggable={draggable}
      onDragStart={
        draggable
          ? (e) => {
              e.dataTransfer.setData('text/plain', task.id)
              e.dataTransfer.effectAllowed = 'move'
              onDragStart(task.id)
            }
          : undefined
      }
      onDragEnd={draggable ? () => onDragEnd?.() : undefined}
      className={`group flex animate-task-in items-center gap-3 py-2.5 ${
        overdue ? 'border-l-2 border-danger pl-2' : ''
      } ${dragging ? 'opacity-40' : ''}`}
    >
      {draggable && (
        <span
          className="hidden shrink-0 cursor-grab self-start pt-1 text-ink-soft opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100 sm:block"
          aria-hidden="true"
          title="Zum Verschieben ziehen"
        >
          <GripVertical size={14} />
        </span>
      )}
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
          {highPriority && (
            <Flag
              size={12}
              strokeWidth={2.5}
              className="mr-1 inline-block -translate-y-px fill-danger text-danger"
              aria-label="Hohe Priorität"
            />
          )}
          {task.title}
        </span>
        {(task.description || steps.total > 0) && (
          <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-soft">
            {steps.total > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1">
                <ListChecks size={12} />
                {steps.done}/{steps.total}
              </span>
            )}
            {task.description && (
              <span className="line-clamp-1 min-w-0">{task.description}</span>
            )}
          </span>
        )}
        {tags.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-block rounded-full bg-canvas px-1.5 py-0.5 text-[10px] leading-none text-ink-soft"
              >
                #{t}
              </span>
            ))}
          </span>
        )}
      </button>

      {task.repeat && (
        <span
          className="shrink-0 self-start pt-0.5 text-ink-soft"
          title={`Wiederholt sich: ${repeatLabel(task.repeat)}`}
        >
          <Repeat size={13} aria-hidden="true" />
          <span className="sr-only">
            Wiederholt sich: {repeatLabel(task.repeat)}
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

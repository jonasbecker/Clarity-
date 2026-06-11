import { useState } from 'react'
import { areas } from '../data/dummyData.js'
import TaskCard from './TaskCard.jsx'

// Eine nach Bereich gruppierte Liste offener Tasks (z.B. alle "Studium").
// Reicht die Aktionen onToggle/onDelete an jede TaskCard weiter.
//
// Drag & Drop: jede Karte lässt sich anfassen und in eine andere Bereichs-
// Spalte ziehen (Desktop). `dragging` zeigt an, dass gerade gezogen wird —
// dann erscheinen auch leere Spalten als Ablagefläche.
export default function TaskGroup({
  areaId,
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onMoveArea,
  onDragStart,
  onDragEnd,
  draggingId,
  dragging,
}) {
  const area = areas[areaId]
  const [over, setOver] = useState(false)

  // Leere Spalte nur während eines Drags als Ablagefläche zeigen.
  if (tasks.length === 0 && !dragging) return null

  const dropProps = onMoveArea
    ? {
        onDragOver: (e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          if (!over) setOver(true)
        },
        onDragLeave: (e) => {
          // Nur zurücksetzen, wenn der Cursor die Spalte wirklich verlässt.
          if (!e.currentTarget.contains(e.relatedTarget)) setOver(false)
        },
        onDrop: (e) => {
          e.preventDefault()
          const id = e.dataTransfer.getData('text/plain')
          setOver(false)
          if (id) onMoveArea(id, areaId)
        },
      }
    : {}

  return (
    <div
      {...dropProps}
      className={`rounded-2xl border bg-surface p-5 shadow-sm transition-colors ${
        over ? 'border-ink/40 ring-2 ring-ink/20' : 'border-line'
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: area.color }}
          aria-hidden="true"
        />
        <h3 className="text-sm font-semibold">{area.label}</h3>
        <span className="text-xs text-ink-soft">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="py-3 text-center text-xs text-ink-soft">Hierher ziehen …</p>
      ) : (
        <div className="divide-y divide-line">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              dragging={draggingId === task.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import TaskCard from './TaskCard.jsx'

// Die drei Lernaufgaben-Spalten. `done` ist die Quelle der Wahrheit für
// "Fertig"; offene Tasks teilen sich nach `status` in "Nicht angefangen"
// (todo) und "In Arbeit" (doing).
const COLUMNS = [
  { id: 'todo', label: 'Nicht angefangen' },
  { id: 'doing', label: 'In Arbeit' },
  { id: 'done', label: 'Fertig' },
]

function columnOf(task) {
  if (task.done) return 'done'
  return task.status === 'doing' ? 'doing' : 'todo'
}

// Kanban-Board für die Aufgaben eines Kurses. Karten lassen sich am Desktop
// per Drag & Drop zwischen den Spalten ziehen (native HTML5-DnD, gleiche
// Technik wie der Bereichs-Drag in der Task-Liste). Auf dem Smartphone, wo
// DnD unzuverlässig ist, verschieben kleine Pfeil-Knöpfe die Karte.
export default function KanbanBoard({ tasks, onToggle, onEdit, onDelete, onMoveStatus }) {
  const [draggingId, setDraggingId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const byCol = { todo: [], doing: [], done: [] }
  for (const t of tasks) byCol[columnOf(t)].push(t)

  function handleDrop(e, colId) {
    e.preventDefault()
    setOverCol(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id) onMoveStatus(id, colId)
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {COLUMNS.map((col, colIdx) => {
        const items = byCol[col.id]
        const active = overCol === col.id
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setOverCol(col.id)
            }}
            onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`rounded-2xl border p-3 transition-colors ${
              active ? 'border-ink/40 bg-surface' : 'border-line bg-surface/60'
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {col.label}
              </h4>
              <span className="text-xs text-ink-soft">{items.length}</span>
            </div>

            {items.length === 0 ? (
              <p className="px-1 py-4 text-center text-xs text-ink-soft">—</p>
            ) : (
              <ul className="space-y-1">
                {items.map((t) => (
                  <li key={t.id} className="rounded-xl px-1">
                    <TaskCard
                      task={t}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDragStart={setDraggingId}
                      onDragEnd={() => setDraggingId(null)}
                      dragging={draggingId === t.id}
                    />
                    {/* Touch-Fallback: in die Nachbarspalte verschieben */}
                    <div className="flex justify-end gap-1 pb-1 sm:hidden">
                      {colIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => onMoveStatus(t.id, COLUMNS[colIdx - 1].id)}
                          aria-label={`Nach „${COLUMNS[colIdx - 1].label}" verschieben`}
                          className="grid size-7 place-items-center rounded-full text-ink-soft transition-colors hover:bg-canvas"
                        >
                          <ArrowLeft size={14} />
                        </button>
                      )}
                      {colIdx < COLUMNS.length - 1 && (
                        <button
                          type="button"
                          onClick={() => onMoveStatus(t.id, COLUMNS[colIdx + 1].id)}
                          aria-label={`Nach „${COLUMNS[colIdx + 1].label}" verschieben`}
                          className="grid size-7 place-items-center rounded-full text-ink-soft transition-colors hover:bg-canvas"
                        >
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

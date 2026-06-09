import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import TaskCard from './TaskCard.jsx'

// Eingeklappter Bereich für erledigte Tasks ("Heute geschafft").
// Standardmäßig zu — ein Klick zeigt die abgehakten Tasks.
export default function CompletedTasks({ tasks, onToggle, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  if (tasks.length === 0) return null

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-1 py-2 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
        />
        Erledigt
        <span className="text-xs">{tasks.length}</span>
      </button>

      {open && (
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface px-5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

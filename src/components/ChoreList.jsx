import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'

// Allgemeine To-Dos: schlanke, studiumsfremde Checkliste (Mensakarte aufladen
// usw.). Bewusst minimal — nur Titel, abhaken, löschen.
export default function ChoreList({ chores, onAdd, onToggle, onRemove }) {
  const [title, setTitle] = useState('')

  function submit(e) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    onAdd({ title: t })
    setTitle('')
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-ink-soft">Allgemeine To-Dos</h2>
      <div className="rounded-2xl border border-line bg-surface p-3">
        {chores.length > 0 && (
          <ul className="mb-2 divide-y divide-line">
            {chores.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => onToggle(c.id, !c.done)}
                  aria-pressed={c.done}
                  aria-label={c.done ? 'Als offen markieren' : 'Als erledigt markieren'}
                  className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                    c.done ? 'border-ink bg-ink' : 'border-line'
                  }`}
                >
                  {c.done && <Check size={12} strokeWidth={3} className="text-canvas" />}
                </button>
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    c.done ? 'text-ink-soft line-through' : ''
                  }`}
                >
                  {c.title}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(c.id)}
                  aria-label={`„${c.title}" löschen`}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-ink-soft opacity-0 transition-opacity hover:bg-canvas hover:text-danger group-hover:opacity-100 sm:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Neues To-Do …"
            className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink/30"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            aria-label="Hinzufügen"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-canvas transition-opacity disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </form>
      </div>
    </section>
  )
}

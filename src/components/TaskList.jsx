import { useState } from 'react'
import { Search, X } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import TaskGroup from './TaskGroup.jsx'
import CompletedTasks from './CompletedTasks.jsx'
import { areas } from '../data/dummyData.js'

// Bereichsfilter-Chips: "Alle" + die drei Lebensbereiche.
const FILTERS = [{ id: 'all', label: 'Alle' }, ...Object.values(areas)]

// Liste der Tasks: Suche + Bereichsfilter oben, offene nach Bereich
// gruppiert, erledigte separat unten in einem einklappbaren Bereich.
export default function TaskList({
  tasks,
  loading,
  onToggle,
  onEdit,
  onDelete,
}) {
  const [query, setQuery] = useState('')
  const [areaFilter, setAreaFilter] = useState('all')

  const hasFilters = query.trim() !== '' || areaFilter !== 'all'
  const q = query.trim().toLowerCase()
  const filtered = tasks.filter((t) => {
    if (areaFilter !== 'all' && t.area !== areaFilter) return false
    if (
      q &&
      !t.title.toLowerCase().includes(q) &&
      !t.description?.toLowerCase().includes(q)
    )
      return false
    return true
  })

  const open = filtered.filter((t) => !t.done)
  const done = filtered.filter((t) => t.done)

  return (
    <section className="mb-10">
      <SectionTitle aside={loading ? '' : `${open.length} offen`}>
        Offene Tasks
      </SectionTitle>

      {loading ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          Lädt …
        </p>
      ) : tasks.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          Noch keine Tasks. Tipp unten auf „+", um deine erste zu erfassen.
        </p>
      ) : (
        <>
          {/* Suche + Bereichsfilter */}
          <div className="mb-4 space-y-2">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tasks durchsuchen …"
                className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-9 text-sm outline-none transition-colors focus:border-ink/30"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Suche leeren"
                  className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-soft transition-colors hover:text-ink"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = areaFilter === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setAreaFilter(f.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'border-ink bg-ink text-canvas'
                        : 'border-line text-ink-soft hover:border-ink/30'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
              Keine Treffer.
            </p>
          ) : (
            <>
              {open.length === 0
                ? !hasFilters && (
                    <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
                      Alles abgehakt — stark! 🎉
                    </p>
                  )
                : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {Object.keys(areas).map((areaId) => (
                        <TaskGroup
                          key={areaId}
                          areaId={areaId}
                          tasks={open.filter((t) => t.area === areaId)}
                          onToggle={onToggle}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  )}

              <CompletedTasks
                tasks={done}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </>
          )}
        </>
      )}
    </section>
  )
}

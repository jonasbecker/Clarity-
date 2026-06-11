import { useEffect, useState } from 'react'
import { Search, X, Sparkles, PartyPopper, SearchX } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import TaskGroup from './TaskGroup.jsx'
import CompletedTasks from './CompletedTasks.jsx'
import { SkeletonLine, SkeletonRow } from './Skeleton.jsx'
import { areas } from '../data/dummyData.js'
import { isOverdue } from '../lib/date.js'
import { allTags } from '../lib/tags.js'

// Bereichsfilter-Chips: "Alle" + die drei Lebensbereiche.
const AREA_FILTERS = [{ id: 'all', label: 'Alle' }, ...Object.values(areas)]

// Liste der Tasks: Suche + Bereichsfilter oben, offene nach Bereich
// gruppiert, erledigte separat unten in einem einklappbaren Bereich.
export default function TaskList({
  tasks,
  loading,
  onToggle,
  onEdit,
  onDelete,
  onMoveArea,
  searchInputRef,
  focusArea,
}) {
  const [query, setQuery] = useState('')
  const [areaFilter, setAreaFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState(null) // aktiver Tag oder null
  const [draggingId, setDraggingId] = useState(null) // gerade gezogene Task

  // Von außen gesetzter Bereichsfilter (z.B. Klick in der Statistik). Wir
  // übernehmen ihn als Startwert in den lokalen Filter; danach bleibt die
  // Auswahl wieder beim Nutzer.
  useEffect(() => {
    if (focusArea?.area) setAreaFilter(focusArea.area)
  }, [focusArea])

  // Alle vorkommenden Tags für die Filter-Leiste.
  const tags = allTags(tasks)
  // Verschwindet der aktive Tag (z.B. letzte Task gelöscht), Filter lösen.
  useEffect(() => {
    if (tagFilter && !tags.includes(tagFilter)) setTagFilter(null)
  }, [tags, tagFilter])

  // Wie viele offene Tasks sind überfällig? Steuert den "Überfällig"-Chip.
  const overdueCount = tasks.filter(
    (t) => !t.done && isOverdue(t.due_date),
  ).length
  // Chip nur anbieten, wenn es etwas Überfälliges gibt.
  const FILTERS =
    overdueCount > 0
      ? [...AREA_FILTERS, { id: 'overdue', label: `Überfällig (${overdueCount})` }]
      : AREA_FILTERS

  const hasFilters = query.trim() !== '' || areaFilter !== 'all' || tagFilter != null
  const q = query.trim().toLowerCase()
  const filtered = tasks.filter((t) => {
    if (areaFilter === 'overdue') {
      if (t.done || !isOverdue(t.due_date)) return false
    } else if (areaFilter !== 'all' && t.area !== areaFilter) {
      return false
    }
    if (tagFilter && !(t.tags || []).includes(tagFilter)) return false
    if (
      q &&
      !t.title.toLowerCase().includes(q) &&
      !t.description?.toLowerCase().includes(q) &&
      !(t.tags || []).some((tag) => tag.toLowerCase().includes(q))
    )
      return false
    return true
  })

  // Überfällige Tasks innerhalb der Liste nach oben (stabil sonst).
  const open = filtered
    .filter((t) => !t.done)
    .sort((a, b) => Number(isOverdue(b.due_date)) - Number(isOverdue(a.due_date)))
  const done = filtered.filter((t) => t.done)

  return (
    <section className="mb-10">
      <SectionTitle aside={loading ? '' : `${open.length} offen`}>
        Offene Tasks
      </SectionTitle>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <SkeletonLine className="mb-3 h-2.5 w-1/3" />
              <div className="divide-y divide-line">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
          <Sparkles size={20} />
          <p>Noch keine Tasks. Tipp unten auf „+", um deine erste zu erfassen.</p>
        </div>
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
                ref={searchInputRef}
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

            {/* Tag-Filter: nur zeigen, wenn es Tags gibt. */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const active = tagFilter === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTagFilter(active ? null : t)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-ink bg-ink text-canvas'
                          : 'border-line text-ink-soft hover:border-ink/30'
                      }`}
                    >
                      #{t}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
              <SearchX size={20} />
              <p>Keine Treffer.</p>
            </div>
          ) : (
            <>
              {open.length === 0
                ? !hasFilters && (
                    <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
                      <PartyPopper size={20} />
                      <p>Alles abgehakt — stark!</p>
                    </div>
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
                          // Verschieben nur, wenn alle drei Spalten sichtbar sind.
                          onMoveArea={areaFilter === 'all' ? onMoveArea : undefined}
                          onDragStart={areaFilter === 'all' ? setDraggingId : undefined}
                          onDragEnd={() => setDraggingId(null)}
                          draggingId={draggingId}
                          dragging={draggingId != null}
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

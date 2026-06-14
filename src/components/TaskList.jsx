import { useEffect, useState } from 'react'
import { Search, X, Sparkles, PartyPopper, SearchX } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import TaskCard from './TaskCard.jsx'
import CompletedTasks from './CompletedTasks.jsx'
import { SkeletonRow } from './Skeleton.jsx'
import { isOverdue, toISODate } from '../lib/date.js'
import { allTags } from '../lib/tags.js'
import { EVENT_TYPES } from '../lib/operators.js'

// Liste der Tasks: Suche + Filter oben (Überfällig, Tags, Kurse), danach EINE
// nach Dringlichkeit sortierte Liste der offenen Tasks (überfällige zuerst),
// erledigte separat unten in einem einklappbaren Bereich.
//
// `onTogglePlan`/`onSetStatus` (optional) reichen die „Heute"- und „Dabei"-
// Steuerung an die Karten durch (genutzt in der Heute-Ansicht).
export default function TaskList({
  tasks,
  loading,
  onToggle,
  onEdit,
  onDelete,
  searchInputRef,
  courses = [],
  focusCourse,
  onTogglePlan,
  onSetStatus,
}) {
  const todayISO = toISODate(new Date())
  const [query, setQuery] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [tagFilter, setTagFilter] = useState(null) // aktiver Tag oder null
  const [courseFilter, setCourseFilter] = useState(null) // aktiver Kurs oder null
  const [eventTypeFilter, setEventTypeFilter] = useState(null) // aktive Veranstaltungsart oder null

  // Kurse als Map (id → Kurs) für schnelle Anzeige in den Karten.
  const courseById = new Map(courses.map((c) => [c.id, c]))

  // Von außen gesetzter Kurs-Filter (z.B. Klick im Studium-Hub).
  useEffect(() => {
    if (focusCourse?.id) setCourseFilter(focusCourse.id)
  }, [focusCourse])

  // Alle vorkommenden Tags für die Filter-Leiste — Veranstaltungsarten
  // (eigene Filterzeile, siehe unten) werden hier ausgeblendet, damit sie
  // nicht doppelt erscheinen.
  const tags = allTags(tasks).filter(
    (t) => !EVENT_TYPES.some((e) => e.toLowerCase() === t.toLowerCase()),
  )
  // Verschwindet der aktive Tag (z.B. letzte Task gelöscht), Filter lösen.
  useEffect(() => {
    if (tagFilter && !tags.includes(tagFilter)) setTagFilter(null)
  }, [tags, tagFilter])

  // Veranstaltungsarten, die in den aktuellen Tasks als Tag vorkommen — nur
  // die zeigen wir als eigene Filterzeile (analog zu den Kurs-Chips).
  const usedEventTypes = EVENT_TYPES.filter((e) =>
    tasks.some((t) => (t.tags || []).some((tag) => tag.toLowerCase() === e.toLowerCase())),
  )
  // Aktiven Veranstaltungsart-Filter lösen, wenn sie nicht mehr vorkommt.
  useEffect(() => {
    if (eventTypeFilter && !usedEventTypes.includes(eventTypeFilter)) setEventTypeFilter(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTypeFilter, tasks])

  // Kurse, die in den aktuellen Tasks vorkommen — nur die zeigen wir als
  // Filter-Chips (analog zu den Tags).
  const usedCourseIds = new Set(tasks.map((t) => t.course_id).filter(Boolean))
  const courseChips = courses.filter((c) => usedCourseIds.has(c.id))
  // Aktiven Kurs-Filter lösen, wenn der Kurs nicht mehr vorkommt.
  useEffect(() => {
    if (courseFilter && !usedCourseIds.has(courseFilter)) setCourseFilter(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter, tasks])

  // Wie viele offene Tasks sind überfällig? Steuert den "Überfällig"-Chip.
  const overdueCount = tasks.filter(
    (t) => !t.done && isOverdue(t.due_date),
  ).length
  // Überfällig-Filter lösen, falls nichts mehr überfällig ist.
  useEffect(() => {
    if (overdueOnly && overdueCount === 0) setOverdueOnly(false)
  }, [overdueOnly, overdueCount])

  const hasFilters =
    query.trim() !== '' ||
    overdueOnly ||
    tagFilter != null ||
    courseFilter != null ||
    eventTypeFilter != null
  const q = query.trim().toLowerCase()
  const filtered = tasks.filter((t) => {
    if (overdueOnly && (t.done || !isOverdue(t.due_date))) return false
    if (tagFilter && !(t.tags || []).includes(tagFilter)) return false
    if (courseFilter && t.course_id !== courseFilter) return false
    if (
      eventTypeFilter &&
      !(t.tags || []).some((tag) => tag.toLowerCase() === eventTypeFilter.toLowerCase())
    )
      return false
    if (
      q &&
      !t.title.toLowerCase().includes(q) &&
      !t.description?.toLowerCase().includes(q) &&
      !(t.tags || []).some((tag) => tag.toLowerCase().includes(q))
    )
      return false
    return true
  })

  // Offene Tasks nach Dringlichkeit: überfällige zuerst, dann nach
  // Fälligkeitsdatum (datierte vor undatierten), sonst stabil.
  const open = filtered
    .filter((t) => !t.done)
    .sort((a, b) => {
      const oa = isOverdue(a.due_date) ? 0 : 1
      const ob = isOverdue(b.due_date) ? 0 : 1
      if (oa !== ob) return oa - ob
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
  const done = filtered.filter((t) => t.done)

  return (
    <section className="mb-10">
      <SectionTitle aside={loading ? '' : `${open.length} offen`}>
        Offene Tasks
      </SectionTitle>

      {loading ? (
        <div className="rounded-2xl border border-line bg-surface px-4 shadow-sm sm:px-5">
          <div className="divide-y divide-line">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
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
            {/* Überfällig-Filter: nur zeigen, wenn etwas überfällig ist. */}
            {overdueCount > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOverdueOnly((v) => !v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    overdueOnly
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-line text-ink-soft hover:border-ink/30'
                  }`}
                >
                  Überfällig ({overdueCount})
                </button>
              </div>
            )}

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

            {/* Veranstaltungsart-Filter: eigene Zeile, nur wenn vorhanden. */}
            {usedEventTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {usedEventTypes.map((e) => {
                  const active = eventTypeFilter === e
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEventTypeFilter(active ? null : e)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-ink bg-ink text-canvas'
                          : 'border-line text-ink-soft hover:border-ink/30'
                      }`}
                    >
                      {e}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Kurs-Filter: nur wenn Kurse in den Aufgaben vorkommen. */}
            {courseChips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {courseChips.map((c) => {
                  const active = courseFilter === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCourseFilter(active ? null : c.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-ink bg-ink text-canvas'
                          : 'border-line text-ink-soft hover:border-ink/30'
                      }`}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: c.color || 'var(--color-area-study)' }}
                        aria-hidden="true"
                      />
                      {c.name}
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
                    <div className="rounded-2xl border border-line bg-surface px-4 shadow-sm sm:px-5">
                      <div className="divide-y divide-line">
                        {open.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={onToggle}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            courseById={courseById}
                            planned={task.planned_date === todayISO}
                            onTogglePlan={onTogglePlan}
                            onSetStatus={onSetStatus}
                          />
                        ))}
                      </div>
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

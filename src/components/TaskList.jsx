import { useEffect, useState } from 'react'
import { ArrowUpDown, PartyPopper, Sparkles, X } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import TaskCard from './TaskCard.jsx'
import CompletedTasks from './CompletedTasks.jsx'
import { SkeletonRow } from './Skeleton.jsx'
import { toISODate } from '../lib/date.js'
import { orderForToday } from '../lib/focus.js'

// Sortieroptionen für die offenen Tasks (Sort-Button neben "Offene Tasks").
const SORT_OPTIONS = [
  { id: 'urgency', label: 'Dringlichkeit' },
  { id: 'duration', label: 'Länge' },
  { id: 'course', label: 'Fach' },
]

// Liste der Tasks: EINE sortierbare Liste der offenen Tasks (Sort-Button
// steuert die Reihenfolge), erledigte separat unten in einem einklappbaren
// Bereich.
//
// `onTogglePlan`/`onSetStatus` (optional) reichen die „Heute"- und „Dabei"-
// Steuerung an die Karten durch (genutzt in der Heute-Ansicht).
export default function TaskList({
  tasks,
  loading,
  onToggle,
  onEdit,
  onDelete,
  courses = [],
  focusCourse,
  onTogglePlan,
  onSetStatus,
}) {
  const todayISO = toISODate(new Date())
  const [courseFilter, setCourseFilter] = useState(null) // aktiver Kurs oder null (Sprung aus dem Studium-Hub)
  const [sortBy, setSortBy] = useState('urgency')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)

  // Kurse als Map (id → Kurs) für schnelle Anzeige in den Karten.
  const courseById = new Map(courses.map((c) => [c.id, c]))

  // Von außen gesetzter Kurs-Filter (z.B. Klick im Studium-Hub).
  useEffect(() => {
    if (focusCourse?.id) setCourseFilter(focusCourse.id)
  }, [focusCourse])

  // Kurse, die in den aktuellen Tasks vorkommen — nur dann bleibt ein
  // gesetzter Kurs-Filter (Sprung) gültig.
  const usedCourseIds = new Set(tasks.map((t) => t.course_id).filter(Boolean))
  // Aktiven Kurs-Filter lösen, wenn der Kurs nicht mehr vorkommt.
  useEffect(() => {
    if (courseFilter && !usedCourseIds.has(courseFilter)) setCourseFilter(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter, tasks])

  const filtered = courseFilter
    ? tasks.filter((t) => t.course_id === courseFilter)
    : tasks

  // Offene Tasks, sortiert nach der gewählten Sortierung.
  function sortOpenTasks(openTasks) {
    if (sortBy === 'duration') {
      return openTasks.slice().sort((a, b) => {
        if (a.duration_min == null) return 1
        if (b.duration_min == null) return -1
        return a.duration_min - b.duration_min
      })
    }
    if (sortBy === 'course') {
      return openTasks.slice().sort((a, b) => {
        const an = courseById.get(a.course_id)?.name
        const bn = courseById.get(b.course_id)?.name
        if (!an) return 1
        if (!bn) return -1
        return an.localeCompare(bn)
      })
    }
    return orderForToday(openTasks)
  }
  const open = sortOpenTasks(filtered.filter((t) => !t.done))
  const done = filtered.filter((t) => t.done)

  return (
    <section className="mb-10">
      <SectionTitle
        aside={
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            {!loading && `${open.length} offen`}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortMenuOpen((v) => !v)}
                aria-label="Sortieren"
                aria-expanded={sortMenuOpen}
                className="grid size-7 place-items-center rounded-full transition-colors hover:bg-surface hover:text-ink"
              >
                <ArrowUpDown size={14} />
              </button>
              {sortMenuOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-xl border border-line bg-surface p-1 shadow-sm">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id)
                        setSortMenuOpen(false)
                      }}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortBy === opt.id ? 'bg-ink text-canvas' : 'text-ink hover:bg-canvas'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
      >
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
          {/* Kurs-Sprung-Hinweis: nur sichtbar, wenn von außen (Studium-Hub) zu
              einem Kurs gesprungen wurde. */}
          {courseFilter && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setCourseFilter(null)}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-ink px-3 py-1 text-xs font-medium text-canvas"
              >
                Kurs: {courseById.get(courseFilter)?.name ?? ''}
                <X size={12} />
              </button>
            </div>
          )}

          {open.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
              <PartyPopper size={20} />
              <p>Alles abgehakt — stark!</p>
            </div>
          ) : (
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

          <CompletedTasks tasks={done} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
        </>
      )}
    </section>
  )
}

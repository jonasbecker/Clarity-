import { useEffect, useState } from 'react'
import { X, Sparkles, PartyPopper, SearchX } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import TaskCard from './TaskCard.jsx'
import CompletedTasks from './CompletedTasks.jsx'
import { SkeletonRow } from './Skeleton.jsx'
import { isOverdue, toISODate } from '../lib/date.js'

// Liste der Tasks: EINE nach Dringlichkeit sortierte Liste der offenen Tasks
// (überfällige zuerst), erledigte separat unten in einem einklappbaren
// Bereich. Bewusst ohne Such-/Filterleiste, damit die Heute-Ansicht
// übersichtlich bleibt.
//
// Einzige Ausnahme: Springt man aus einem Fach (Studium-Hub) hierher, wird
// `focusCourse` gesetzt und die Liste auf diesen Kurs vorgefiltert — sichtbar
// als wegklickbarer Hinweis.
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
  const [courseFilter, setCourseFilter] = useState(null) // aktiver Kurs oder null

  // Kurse als Map (id → Kurs) für schnelle Anzeige in den Karten + Hinweis.
  const courseById = new Map(courses.map((c) => [c.id, c]))

  // Von außen gesetzter Kurs-Filter (Sprung aus dem Studium-Hub).
  useEffect(() => {
    if (focusCourse?.id) setCourseFilter(focusCourse.id)
  }, [focusCourse])

  // Aktiven Kurs-Filter lösen, wenn der Kurs nicht mehr vorkommt.
  const usedCourseIds = new Set(tasks.map((t) => t.course_id).filter(Boolean))
  useEffect(() => {
    if (courseFilter && !usedCourseIds.has(courseFilter)) setCourseFilter(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter, tasks])

  const hasFilters = courseFilter != null
  const filtered = tasks.filter((t) => {
    if (courseFilter && t.course_id !== courseFilter) return false
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

  const activeCourse = courseFilter ? courseById.get(courseFilter) : null

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
          {/* Kurs-Hinweis: nur nach einem Sprung aus dem Studium-Hub. */}
          {activeCourse && (
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-ink bg-ink px-3 py-1 text-xs font-medium text-canvas">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: activeCourse.color || 'var(--color-area-study)' }}
                aria-hidden="true"
              />
              Gefiltert nach: {activeCourse.name}
              <button
                type="button"
                onClick={() => setCourseFilter(null)}
                aria-label="Filter aufheben"
                className="ml-0.5 transition-opacity hover:opacity-70"
              >
                <X size={13} />
              </button>
            </div>
          )}

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

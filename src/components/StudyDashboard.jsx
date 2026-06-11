import { useEffect } from 'react'
import {
  X,
  GraduationCap,
  Award,
  CalendarClock,
  Layers,
  Pencil,
  ChevronRight,
} from 'lucide-react'
import { upcomingExams, undatedExams } from '../lib/exams.js'
import {
  weightedAverage,
  totalEcts,
  earnedEcts,
  bySemester,
  formatGrade,
} from '../lib/grades.js'
import { formatDueLabel } from '../lib/date.js'

// Countdown-Text für eine Klausur (Tage bis zum Termin).
function countdown(days) {
  if (days < 0) return 'überfällig'
  if (days === 0) return 'heute'
  if (days === 1) return 'morgen'
  return `in ${days} Tagen`
}

// Vollbild-Studium-Übersicht: anstehende Klausuren, offene Tasks pro Kurs und
// der Notenspiegel (ECTS-gewichtet). Folgt dem Overlay-Muster aus StatsView
// (Escape schließt, Hintergrund gesperrt). Rein lesend/aggregierend über die
// bereits geladenen Tasks + Kurse — funktioniert in Demo und mit Supabase.
export default function StudyDashboard({
  tasks,
  courses,
  onClose,
  onEditCourse,
  onFilterCourse,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const exams = upcomingExams(tasks, courses)
  const undated = undatedExams(tasks)
  const avg = weightedAverage(courses)
  const earned = earnedEcts(courses)
  const total = totalEcts(courses)
  const ectsPct = total > 0 ? Math.round((earned / total) * 100) : 0
  const semesters = bySemester(courses)

  // Offene Tasks je Kurs (Anzahl + nächste Fälligkeit).
  const openByCourse = new Map()
  for (const t of tasks) {
    if (t.done || !t.course_id) continue
    if (!openByCourse.has(t.course_id)) openByCourse.set(t.course_id, [])
    openByCourse.get(t.course_id).push(t)
  }
  function nextDue(list) {
    const dates = list.map((t) => t.due_date).filter(Boolean).sort()
    return dates[0] ?? null
  }

  const isEmpty = courses.length === 0 && exams.length === 0 && undated.length === 0

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <GraduationCap size={22} />
            Studium
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Studium schließen"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
          >
            <X size={20} />
          </button>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
            <GraduationCap size={20} />
            <p>
              Noch nichts fürs Studium — leg einen Kurs an oder markier eine Task
              als Klausur, dann erscheint hier deine Übersicht.
            </p>
          </div>
        ) : (
          <>
            {/* Kennzahlen */}
            <div className="mb-8 grid grid-cols-3 gap-3">
              <MetricCard
                icon={Award}
                label="Notenschnitt"
                value={formatGrade(avg, 2)}
              />
              <MetricCard
                icon={Layers}
                label="ECTS geschafft"
                value={`${earned}/${total}`}
              />
              <MetricCard
                icon={CalendarClock}
                label="Klausuren"
                value={exams.length}
              />
            </div>

            {/* Anstehende Klausuren */}
            {(exams.length > 0 || undated.length > 0) && (
              <section className="mb-8">
                <h3 className="mb-3 text-sm font-semibold text-ink-soft">
                  Anstehende Klausuren
                </h3>
                <div className="space-y-2.5">
                  {exams.map(({ task, course, days, progress }) => {
                    const pct =
                      progress.total > 0
                        ? Math.round((progress.done / progress.total) * 100)
                        : 0
                    const color = course?.color || 'var(--color-area-study)'
                    return (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-line bg-surface p-4"
                        style={{ borderLeft: `3px solid ${color}` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{task.title}</p>
                            {course && (
                              <p className="mt-0.5 text-xs text-ink-soft">{course.name}</p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p
                              className={`text-sm font-semibold ${
                                days < 0 ? 'text-danger' : ''
                              }`}
                            >
                              {countdown(days)}
                            </p>
                            <p className="text-xs text-ink-soft">
                              {formatDueLabel(task.due_date)}
                            </p>
                          </div>
                        </div>
                        {progress.total > 0 && (
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs text-ink-soft">
                              <span>Lernfortschritt</span>
                              <span>
                                {progress.done}/{progress.total}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-line">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {undated.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium">{task.title}</span>
                      <span className="shrink-0 text-xs text-ink-soft">Datum fehlt</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Kurse: offene Tasks + nächste Deadline, klickbar zum Filtern */}
            {courses.length > 0 && (
              <section className="mb-8">
                <h3 className="mb-3 text-sm font-semibold text-ink-soft">Kurse</h3>
                <div className="space-y-2">
                  {courses.map((c) => {
                    const open = openByCourse.get(c.id) || []
                    const due = nextDue(open)
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-3"
                      >
                        <button
                          type="button"
                          onClick={() => onFilterCourse?.(c.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: c.color || 'var(--color-area-study)' }}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {c.name}
                            </span>
                            <span className="block text-xs text-ink-soft">
                              {[
                                c.semester,
                                c.ects != null ? `${c.ects} ECTS` : null,
                                `Note ${formatGrade(c.grade)}`,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-xs text-ink-soft">
                            {open.length > 0 ? (
                              <>
                                {open.length} offen
                                {due && (
                                  <span className="block">{formatDueLabel(due)}</span>
                                )}
                              </>
                            ) : (
                              '—'
                            )}
                          </span>
                          <ChevronRight size={15} className="shrink-0 text-ink-soft" />
                        </button>
                        {onEditCourse && (
                          <button
                            type="button"
                            onClick={() => onEditCourse(c)}
                            aria-label={`Kurs ${c.name} bearbeiten`}
                            className="grid size-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Notenspiegel: ECTS-Fortschritt + Schnitt je Semester */}
            {courses.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-semibold text-ink-soft">Notenspiegel</h3>
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-ink-soft">
                    <span>ECTS-Fortschritt</span>
                    <span>
                      {earned}/{total} ({ectsPct}%)
                    </span>
                  </div>
                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-ink/70"
                      style={{ width: `${ectsPct}%` }}
                    />
                  </div>
                  <ul className="divide-y divide-line">
                    {semesters.map((s) => (
                      <li
                        key={s.semester}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="text-ink-soft">{s.semester}</span>
                        <span>
                          Ø {formatGrade(s.avg, 2)}
                          <span className="ml-2 text-xs text-ink-soft">
                            {s.ects} ECTS
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <Icon size={16} className="text-ink-soft" />
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  )
}

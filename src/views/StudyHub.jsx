import { Award, CalendarClock, GraduationCap, Layers, ChevronRight } from 'lucide-react'
import ChoreList from '../components/ChoreList.jsx'
import StudyPlanner from '../components/StudyPlanner.jsx'
import { getGreeting, formatLongDate, formatDueLabel } from '../lib/date.js'
import { upcomingExams } from '../lib/exams.js'
import {
  weightedAverage,
  totalEcts,
  earnedEcts,
  bySemester,
  formatGrade,
} from '../lib/grades.js'

// Countdown-Text für eine Klausur (Tage bis zum Termin).
function countdown(days) {
  if (days < 0) return 'überfällig'
  if (days === 0) return 'heute'
  if (days === 1) return 'morgen'
  return `in ${days} Tagen`
}

// Der Studium-Hub: die neue Startseite. Zeigt Kennzahlen, anstehende
// Klausuren, eine Kachel-Galerie der aktuellen Kurse und den Notenspiegel.
// Rein lesend/aggregierend über die bereits geladenen Tasks + Kurse —
// funktioniert in Demo und mit Supabase. Archivierte Kurse bleiben außen vor.
//
// `onOpenCourse(id)` öffnet einen Kurs (ab Phase 2 die Fach-Detailseite).
export default function StudyHub({
  name,
  tasks,
  courses,
  planPrefs,
  onEditTask,
  onOpenCourse,
  onEndSemester,
  chores,
  onAddChore,
  onToggleChore,
  onRemoveChore,
}) {
  const active = courses.filter((c) => !c.archived)
  const exams = upcomingExams(tasks, active)
  const avg = weightedAverage(active)
  const earned = earnedEcts(active)
  const total = totalEcts(active)
  const ectsPct = total > 0 ? Math.round((earned / total) * 100) : 0
  const semesters = bySemester(active)

  // Offene Tasks je Kurs zählen.
  const openByCourse = new Map()
  for (const t of tasks) {
    if (t.done || !t.course_id) continue
    openByCourse.set(t.course_id, (openByCourse.get(t.course_id) || 0) + 1)
  }

  const isEmpty = active.length === 0 && exams.length === 0

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-28 pt-6 sm:px-8 sm:pt-10">
      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">
          {formatLongDate()}
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {getGreeting()}, {name}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Dein Studium auf einen Blick</p>
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
          <GraduationCap size={20} />
          <p>
            Noch keine Kurse — leg im Bereich „Heute" beim Anlegen einer
            Studium-Task einen Kurs an, dann erscheint hier deine Übersicht.
          </p>
        </div>
      ) : (
        <>
          {/* Kennzahlen */}
          <div className="mb-8 grid grid-cols-3 gap-3">
            <MetricCard icon={Award} label="Notenschnitt" value={formatGrade(avg, 2)} />
            <MetricCard icon={Layers} label="ECTS geschafft" value={`${earned}/${total}`} />
            <MetricCard icon={CalendarClock} label="Klausuren" value={exams.length} />
          </div>

          {/* Anstehende Klausuren */}
          {exams.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-ink-soft">
                Anstehende Klausuren
              </h2>
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
                          <p className={`text-sm font-semibold ${days < 0 ? 'text-danger' : ''}`}>
                            {countdown(days)}
                          </p>
                          <p className="text-xs text-ink-soft">{formatDueLabel(task.due_date)}</p>
                        </div>
                      </div>
                      {progress.total > 0 && (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs text-ink-soft">
                            <span>Lernfortschritt</span>
                            <span>{progress.done}/{progress.total}</span>
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
              </div>
            </section>
          )}

          {/* „Schlau einplanen": verteilt offene Lernaufgaben deadline-bewusst
              in die Arbeitszeiten — hier direkt neben den Klausuren. */}
          {planPrefs && onEditTask && (
            <StudyPlanner
              tasks={tasks}
              courses={active}
              prefs={planPrefs}
              onEditTask={onEditTask}
            />
          )}

          {/* Kurs-Galerie */}
          {active.length > 0 && (
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink-soft">Deine Kurse</h2>
                <button
                  type="button"
                  onClick={onEndSemester}
                  className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30"
                >
                  Semester abschließen
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {active.map((c) => {
                  const open = openByCourse.get(c.id) || 0
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onOpenCourse?.(c.id)}
                      className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-ink/30"
                      style={{ borderTop: `3px solid ${c.color || 'var(--color-area-study)'}` }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.name}</span>
                        <span className="mt-0.5 block text-xs text-ink-soft">
                          {[
                            c.semester,
                            c.ects != null ? `${c.ects} ECTS` : null,
                            `Note ${formatGrade(c.grade)}`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        <span className="mt-1 block text-xs text-ink-soft">
                          {open > 0 ? `${open} offene Aufgabe${open === 1 ? '' : 'n'}` : 'Keine offenen Aufgaben'}
                        </span>
                      </span>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5"
                      />
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* Notenspiegel */}
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink-soft">Notenspiegel</h2>
              <div className="rounded-2xl border border-line bg-surface p-4">
                <div className="mb-1 flex items-center justify-between text-xs text-ink-soft">
                  <span>ECTS-Fortschritt</span>
                  <span>{earned}/{total} ({ectsPct}%)</span>
                </div>
                <div className="mb-4 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-ink/70" style={{ width: `${ectsPct}%` }} />
                </div>
                <ul className="divide-y divide-line">
                  {semesters.map((s) => (
                    <li key={s.semester} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-ink-soft">{s.semester}</span>
                      <span>
                        Ø {formatGrade(s.avg, 2)}
                        <span className="ml-2 text-xs text-ink-soft">{s.ects} ECTS</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}

      {/* Allgemeine To-Dos — unabhängig vom Studium, immer sichtbar */}
      <div className="mt-8">
        <ChoreList
          chores={chores}
          onAdd={onAddChore}
          onToggle={onToggleChore}
          onRemove={onRemoveChore}
        />
      </div>
    </main>
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

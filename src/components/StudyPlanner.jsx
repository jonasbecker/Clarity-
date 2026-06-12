import { useState } from 'react'
import { CalendarCheck, Sparkles, AlertTriangle } from 'lucide-react'
import { buildStudyPlan } from '../lib/studyPlan.js'
import { isoInDays, weekdayInDays, daysUntil } from '../lib/date.js'

// „Schlau einplanen": verteilt deine offenen Lernaufgaben mit einem Knopf über
// die nächsten Tage in deine Arbeitszeiten — die mit der nächsten Klausur
// zuerst. Jede eingeplante Aufgabe bekommt ihr Datum (due_date), taucht also
// danach am passenden Tag im Tagesplan auf. Klausuren selbst bleiben unberührt
// (sie sind die Fristen).
//
// Props: tasks (alle), courses, prefs (usePlanPrefs), eventsByDate, onEditTask.
const HORIZON_MIN = 7
const HORIZON_MAX = 28

export default function StudyPlanner({ tasks, courses = [], prefs, eventsByDate = {}, onEditTask }) {
  const [result, setResult] = useState(null)

  // Einplanbar: offene Studium-Aufgaben (keine Klausuren — die sind Fristen).
  const schedulable = tasks.filter(
    (t) => !t.done && t.area === 'study' && t.kind !== 'exam',
  )

  // Früheste offene Klausur je Kurs = dessen Lern-Deadline.
  const examByCourse = new Map()
  for (const t of tasks) {
    if (t.kind !== 'exam' || t.done || !t.due_date || !t.course_id) continue
    const cur = examByCourse.get(t.course_id)
    if (!cur || t.due_date < cur) examByCourse.set(t.course_id, t.due_date)
  }

  // Frist einer Aufgabe als Tag-Offset (0 = heute). Die früheste aus eigenem
  // Fälligkeitsdatum und Klausurtermin des Kurses; nichts → keine Frist.
  const deadlineOffsetOf = (task) => {
    const dates = [task.due_date, examByCourse.get(task.course_id)].filter(Boolean)
    if (dates.length === 0) return Infinity
    const earliest = dates.sort()[0]
    return Math.max(0, daysUntil(earliest))
  }

  function plan() {
    if (schedulable.length === 0) return

    // Horizont: bis zur spätesten Frist (mind. 7, höchstens 28 Tage).
    const finite = schedulable
      .map(deadlineOffsetOf)
      .filter((n) => Number.isFinite(n))
    const maxDeadline = finite.length ? Math.max(...finite) : 0
    const dayCount = Math.min(HORIZON_MAX, Math.max(HORIZON_MIN, maxDeadline + 1))

    const dayWindows = Array.from({ length: dayCount }, (_, d) => {
      const w = prefs.windowForWeekday?.(weekdayInDays(d))
      return w ? { workStart: w.start, workEnd: w.end } : null
    })
    const dayEvents = Array.from(
      { length: dayCount },
      (_, d) => eventsByDate[isoInDays(d)] || [],
    )
    const now = new Date().getHours() * 60 + new Date().getMinutes()

    const { assignments, overflow, late } = buildStudyPlan({
      tasks: schedulable,
      deadlineOffsetOf,
      dayWindows,
      dayEvents,
      dayCount,
      now,
    })

    // Ins „Kalender"-Datum eintragen (nur wo es sich ändert).
    const byId = new Map(schedulable.map((t) => [t.id, t]))
    for (const { id, offset } of assignments) {
      const date = isoInDays(offset)
      if (byId.get(id)?.due_date !== date) onEditTask(id, { due_date: date })
    }

    setResult({
      planned: assignments.length,
      overflow: overflow.length,
      late: late.length,
    })
  }

  return (
    <section className="mb-6 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-canvas text-ink-soft">
          <CalendarCheck size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Lernplan erstellen</h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            Verteilt deine {schedulable.length} offene
            {schedulable.length === 1 ? ' Aufgabe' : 'n Aufgaben'} schlau in deine
            Arbeitszeiten — die nächste Klausur zuerst.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={plan}
        disabled={schedulable.length === 0}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-medium text-canvas transition-opacity disabled:opacity-40 sm:w-auto sm:px-5"
      >
        <Sparkles size={16} />
        Schlau einplanen
      </button>

      {result && (
        <div className="mt-3 space-y-1.5 text-sm">
          <p className="flex items-center gap-2 text-ink">
            <CalendarCheck size={15} className="shrink-0 text-ink-soft" />
            {result.planned} Aufgabe{result.planned === 1 ? '' : 'n'} auf die
            nächsten Tage verteilt.
          </p>
          {result.late > 0 && (
            <p className="flex items-start gap-2 text-danger">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              {result.late} davon liegen erst nach der Klausur — plane mehr
              Arbeitszeit ein.
            </p>
          )}
          {result.overflow > 0 && (
            <p className="flex items-start gap-2 text-danger">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              {result.overflow} passen im Zeitraum nicht mehr rein.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

// Deadline-bewusster Lernplaner.
//
// Verteilt offene Aufgaben über mehrere Tage in die Arbeitszeit-Fenster und
// achtet dabei auf Fristen (z.B. das Klausurdatum des Kurses): Aufgaben mit
// der nächsten Deadline kommen zuerst dran und damit auf die frühesten Tage.
// Was im Horizont nicht mehr reinpasst oder erst nach der Frist landen würde,
// wird gemeldet — dann hilft nur, mehr Arbeitszeit einzuplanen.
//
// Reine Funktion (kein State, keine Seiteneffekte) — leicht testbar. Das
// tatsächliche Eintragen ins „Kalender"-Datum (due_date) übernimmt der
// Aufrufer anhand der zurückgegebenen Zuweisungen.

import { buildSchedule } from './scheduler.js'

const PRIO = { high: 0, medium: 1, low: 2 }

// Plant `tasks` über `dayCount` Tage.
//
//   tasks             – einplanbare Aufgaben (ohne Klausuren!), je mit
//                       duration_min/priority
//   deadlineOffsetOf  – (task) => Tag-Offset der Frist (0 = heute) oder
//                       Infinity (keine Frist)
//   dayWindows[d]     – { workStart, workEnd } je Tag-Offset oder null (frei)
//   dayEvents[d]      – bekannte Termine des Tages (aus dem Kalender)
//   dayCount          – Planungshorizont in Tagen
//   now               – aktuelle Uhrzeit in Minuten (nur für heute)
//
// Rückgabe:
//   assignments – [{ id, offset }] welcher Tag je Aufgabe
//   days        – [{ offset, blocks, off }] für eine Vorschau
//   overflow    – Aufgaben, die im Horizont gar nicht reinpassen
//   late        – [{ task, offset, deadlineOffset }] erst nach der Frist
export function buildStudyPlan({
  tasks = [],
  deadlineOffsetOf = () => Infinity,
  dayWindows = [],
  dayEvents = [],
  dayCount = 7,
  now = null,
}) {
  // Reihenfolge: früheste Frist zuerst, dann höhere Priorität, dann die
  // längere Aufgabe (große Brocken zuerst platzieren).
  const ordered = [...tasks].sort((a, b) => {
    const da = deadlineOffsetOf(a)
    const db = deadlineOffsetOf(b)
    if (da !== db) return da - db
    const pa = PRIO[a.priority] ?? 1
    const pb = PRIO[b.priority] ?? 1
    if (pa !== pb) return pa - pb
    return (b.duration_min || 30) - (a.duration_min || 30)
  })

  const days = []
  const assignments = []
  let remaining = ordered
  for (let d = 0; d < dayCount; d++) {
    const win = dayWindows[d] ?? null
    if (!win) {
      days.push({ offset: d, blocks: [], off: true })
      continue
    }
    const { blocks, unscheduled } = buildSchedule({
      tasks: remaining,
      events: dayEvents[d] || [],
      workStart: win.workStart,
      workEnd: win.workEnd,
      now: d === 0 ? now : null,
    })
    for (const b of blocks) assignments.push({ id: b.task.id, offset: d })
    days.push({ offset: d, blocks })
    remaining = unscheduled
  }

  const byId = new Map(tasks.map((t) => [t.id, t]))
  const late = assignments
    .filter((a) => a.offset > deadlineOffsetOf(byId.get(a.id)))
    .map((a) => ({
      task: byId.get(a.id),
      offset: a.offset,
      deadlineOffset: deadlineOffsetOf(byId.get(a.id)),
    }))

  return { assignments, days, overflow: remaining, late }
}

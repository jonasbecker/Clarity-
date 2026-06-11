import { daysUntil } from './date.js'
import { isExam, EXAM_LEAD_DAYS } from './exams.js'

// Wählt die "Fokus heute"-Tasks aus deinen echten Tasks aus.
//
// Noch keine KI — eine simple, nachvollziehbare Regel: offene Tasks nach
// Fälligkeit sortieren (überfällig/heute zuerst, ohne Datum zuletzt) und die
// wichtigsten 3 nehmen. Per "KI-Plan"-Knopf wird das durch einen echten
// Vorschlag ersetzt; die UI bleibt gleich.

// Kleiner = dringender. Ohne Datum ganz nach hinten.
// Klausuren werden in den Tagen davor künstlich dringender (so wandert ihre
// Vorbereitung rechtzeitig nach vorne), ohne den Scheduler selbst zu ändern.
function urgency(task) {
  const d = daysUntil(task.due_date)
  if (d == null) return 99_999
  if (isExam(task)) return d - EXAM_LEAD_DAYS
  return d
}

export function selectFocusTasks(tasks, limit = 3) {
  return orderForToday(tasks).slice(0, limit)
}

// Alle offenen Tasks nach Dringlichkeit geordnet (für den Tagesplan, wenn
// keine KI-Reihenfolge vorliegt).
export function orderForToday(tasks) {
  return tasks
    .filter((t) => !t.done)
    .slice()
    .sort((a, b) => urgency(a) - urgency(b))
}

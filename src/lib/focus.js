import { daysUntil } from './date.js'

// Wählt die "Fokus heute"-Tasks aus deinen echten Tasks aus.
//
// Noch keine KI — eine simple, nachvollziehbare Regel: offene Tasks nach
// Fälligkeit sortieren (überfällig/heute zuerst, ohne Datum zuletzt) und die
// wichtigsten 3 nehmen. Per "KI-Plan"-Knopf wird das durch einen echten
// Vorschlag ersetzt; die UI bleibt gleich.

// Kleiner = dringender. Ohne Datum ganz nach hinten.
function urgency(task) {
  const d = daysUntil(task.due_date)
  return d == null ? 99_999 : d
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

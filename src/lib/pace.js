// Pace-Rückwärtsplanung (deterministisch, ohne KI):
//
//   nötige Minuten/Lerntag = Summe der offenen Aufgaben-Dauern
//                            ÷ verbleibende Lerntage bis zum Ziel
//
// „Lerntage" sind Mo–Fr — Wochenenden (Sa/So) werden herausgerechnet
// (5-Tage-Woche). Das Ziel ist das Klausurdatum des Kurses (früheste offene
// Klausur) oder, falls keine Klausur existiert, das manuell gesetzte
// `course.target_date`. Bewusst sachlich, ohne alarmierende Warnungen.

// Tagesbeginn (00:00 lokal) eines Date.
function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// 'YYYY-MM-DD' → Date (lokal, 00:00).
function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Anzahl Lerntage (Mo–Fr) von heute bis zum Ziel — beide inklusive. Liegt das
// Ziel in der Vergangenheit, sind es 0.
export function studyDaysUntil(targetISO, now = new Date()) {
  const today = startOfDay(now)
  const target = startOfDay(parseISO(targetISO))
  if (target < today) return 0
  let count = 0
  const cur = new Date(today)
  while (cur <= target) {
    const wd = cur.getDay() // 0 = So … 6 = Sa
    if (wd >= 1 && wd <= 5) count += 1
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// Frühestes offenes Klausurdatum eines Kurses (oder null).
export function examDateFor(course, tasks) {
  const dates = tasks
    .filter(
      (t) => t.course_id === course.id && t.kind === 'exam' && !t.done && t.due_date,
    )
    .map((t) => t.due_date)
    .sort()
  return dates[0] ?? null
}

// Zieldatum eines Kurses: Klausur zuerst, sonst manuelles `target_date`.
export function targetDateFor(course, tasks) {
  return examDateFor(course, tasks) || course.target_date || null
}

// Pace für genau einen Kurs. Gibt null zurück, wenn es kein Ziel gibt oder
// keine offenen (Nicht-Klausur-)Aufgaben mehr anstehen.
export function paceFor(course, tasks, now = new Date()) {
  const targetDate = targetDateFor(course, tasks)
  if (!targetDate) return null

  const totalMinutes = tasks
    .filter((t) => t.course_id === course.id && !t.done && t.kind !== 'exam')
    .reduce((sum, t) => sum + (t.duration_min || 0), 0)
  if (totalMinutes <= 0) return null

  const studyDaysLeft = studyDaysUntil(targetDate, now)
  const overdue = startOfDay(parseISO(targetDate)) < startOfDay(now)
  // Mindestens 1 Tag im Nenner, damit „heute/überfällig" eine sinnvolle Zahl
  // ergibt (dann ist alles an einem Tag fällig).
  const minutesPerDay = Math.ceil(totalMinutes / Math.max(studyDaysLeft, 1))

  return { minutesPerDay, studyDaysLeft, targetDate, totalMinutes, overdue }
}

// Reine Helfer rund um Klausuren/Prüfungen.
//
// Eine Klausur ist eine ganz normale Task mit `kind: 'exam'` und einem
// Fälligkeitsdatum (= Klausurdatum). Die Lernthemen sind die vorhandenen
// Subtasks — ihr Fortschritt (subtaskProgress) dient als Lernfortschritt.

import { daysUntil } from './date.js'
import { subtaskProgress } from './subtasks.js'

// Wie viele Tage vor einer Klausur ihre Vorbereitung "dringend" wird, damit
// sie im Tagesplan rechtzeitig nach vorne rutscht (statt erst am Klausurtag).
export const EXAM_LEAD_DAYS = 5

export function isExam(task) {
  return task?.kind === 'exam'
}

// Offene Klausuren MIT Datum, nach Datum sortiert (nächste zuerst), angereichert
// mit Kurs, Tagen bis zur Klausur und Lernfortschritt.
export function upcomingExams(tasks, courses = []) {
  const courseById = new Map(courses.map((c) => [c.id, c]))
  return tasks
    .filter((t) => isExam(t) && !t.done && t.due_date)
    .map((t) => ({
      task: t,
      course: t.course_id ? courseById.get(t.course_id) ?? null : null,
      days: daysUntil(t.due_date),
      progress: subtaskProgress(t.subtasks),
    }))
    .sort((a, b) => a.days - b.days)
}

// Offene Klausuren OHNE Datum (kein Countdown möglich) — separat behandelt.
export function undatedExams(tasks) {
  return tasks.filter((t) => isExam(t) && !t.done && !t.due_date)
}

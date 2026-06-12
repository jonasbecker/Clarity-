import { toISODate } from './date.js'

// Wochenbilanz aus den aktuellen Tasks: wie viele wurden in den letzten 7
// Tagen (inkl. heute) erledigt — insgesamt und als Streak (aufeinanderfolgende
// Tage mit mind. 1 erledigter Task, rückwärts ab heute).
export function weekStats(tasks) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)

  const completed = tasks.filter(
    (t) => t.done && t.completed_at && new Date(t.completed_at) >= start,
  )

  const doneDays = new Set(
    completed.map((t) => toISODate(new Date(t.completed_at))),
  )
  let streak = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (!doneDays.has(toISODate(d))) break
    streak += 1
  }

  return { total: completed.length, streak }
}

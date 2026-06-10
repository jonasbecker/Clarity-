import { orderForToday } from './focus.js'
import { applyOrder } from './usePlanOrder.js'

// Geteilte Logik für die Reihenfolge der Tasks im Tagesplan — damit der
// Tagesplan (DayPlan) UND der Fokus-Modus exakt dieselbe Reihenfolge nutzen.

// Aus dem KI-Plan eine geordnete Task-Liste bauen (Dauer/Begründung
// übernehmen). Liefert null, wenn keine KI-Reihenfolge vorliegt.
export function resolveAiSchedule(tasks, aiPlan, aiStatus) {
  if (
    aiStatus === 'ready' &&
    Array.isArray(aiPlan?.schedule) &&
    aiPlan.schedule.length
  ) {
    return aiPlan.schedule
      .map((s) => {
        const t = tasks.find((x) => x.id === s.id && !x.done)
        return t
          ? { ...t, duration_min: s.duration_min || t.duration_min, reason: s.reason }
          : null
      })
      .filter(Boolean)
  }
  return null
}

// Endgültige Reihenfolge: KI wenn vorhanden, sonst Dringlichkeit — in beiden
// Fällen von der manuellen Reihenfolge überschrieben.
export function orderedPlanTasks(tasks, aiPlan, aiStatus, manualOrder) {
  const aiSchedule = resolveAiSchedule(tasks, aiPlan, aiStatus)
  const base = aiSchedule ?? orderForToday(tasks)
  return { ordered: applyOrder(base, manualOrder), aiActive: Boolean(aiSchedule) }
}

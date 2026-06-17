import { orderForToday } from './focus.js'
import { applyOrder } from './usePlanOrder.js'

// Geteilte Logik für die Reihenfolge der Tasks im Tagesplan — damit der
// Tagesplan (DayPlan) UND der Fokus-Modus exakt dieselbe Reihenfolge nutzen.

// Endgültige Reihenfolge: Dringlichkeit, von der manuellen Reihenfolge
// überschrieben.
export function orderedPlanTasks(tasks, manualOrder) {
  return { ordered: applyOrder(orderForToday(tasks), manualOrder) }
}

import { useMemo } from 'react'
import { paceFor } from './pace.js'

// Dünner Hook über die reine `paceFor`-Funktion: berechnet für eine Liste von
// Kursen je Kurs den Pace-Wert und gibt eine Map (course.id → pace | null)
// zurück. Memoisiert, damit die Rückwärtsplanung nur bei Änderungen an Kursen
// oder Aufgaben neu läuft.
export function usePaceCalculator(courses, tasks) {
  return useMemo(() => {
    const map = new Map()
    for (const c of courses) map.set(c.id, paceFor(c, tasks))
    return map
  }, [courses, tasks])
}

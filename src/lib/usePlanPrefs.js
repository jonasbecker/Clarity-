import { useEffect, useState } from 'react'

// Merkt sich das Arbeitszeit-Fenster für den Tagesplan (innerhalb dessen der
// Scheduler Tasks platziert). Liegt in localStorage — kein Backend nötig.
const KEY = 'clarity-plan-prefs'
const DEFAULTS = { workStart: '09:00', workEnd: '18:00' }

function initial() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.workStart && saved?.workEnd) return saved
  } catch {
    // kaputter/leerer Wert → Standard
  }
  return DEFAULTS
}

export function usePlanPrefs() {
  const [prefs, setPrefs] = useState(initial)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      // localStorage kann blockiert sein — dann nur für diese Sitzung.
    }
  }, [prefs])

  const setWorkStart = (workStart) => setPrefs((p) => ({ ...p, workStart }))
  const setWorkEnd = (workEnd) => setPrefs((p) => ({ ...p, workEnd }))

  return { ...prefs, setWorkStart, setWorkEnd }
}

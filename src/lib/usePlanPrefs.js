import { useEffect, useState } from 'react'

// Merkt sich die Arbeitszeit-Fenster für den Tagesplan (innerhalb derer der
// Scheduler Tasks platziert). Liegt in localStorage — kein Backend nötig.
//
// Zwei Ebenen:
//   workStart/workEnd – das Standard-Fenster (Rückwärtskompatibel; dient als
//                       Vorlage für neue Tage).
//   days[0..6]        – pro Wochentag ein eigenes Fenster { enabled, start, end }.
//                       Index folgt JS getDay(): 0 = Sonntag … 6 = Samstag.
// So lässt sich „Mo–Fr 9–18, Sa kürzer, So frei" abbilden — oder per
// „alle Werktage gleich" mit einem Klick vereinheitlichen.
const KEY = 'clarity-plan-prefs'
const DEFAULT_START = '09:00'
const DEFAULT_END = '18:00'

// Wochentage in Anzeige-Reihenfolge (Mo zuerst), mit JS-getDay-Index.
export const WORK_WEEKDAYS = [
  { wd: 1, label: 'Mo' },
  { wd: 2, label: 'Di' },
  { wd: 3, label: 'Mi' },
  { wd: 4, label: 'Do' },
  { wd: 5, label: 'Fr' },
  { wd: 6, label: 'Sa' },
  { wd: 0, label: 'So' },
]

// Sieben Tage mit identischem Fenster (Standard: jeder Tag ist ein Arbeitstag,
// damit sich das bisherige Verhalten nicht ändert).
function defaultDays(start = DEFAULT_START, end = DEFAULT_END) {
  const days = {}
  for (let wd = 0; wd <= 6; wd++) days[wd] = { enabled: true, start, end }
  return days
}

function initial() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.workStart && saved?.workEnd) {
      // Alte Version ohne `days` → aus dem Standard-Fenster ableiten.
      const days = saved.days ?? defaultDays(saved.workStart, saved.workEnd)
      return { workStart: saved.workStart, workEnd: saved.workEnd, days }
    }
  } catch {
    // kaputter/leerer Wert → Standard
  }
  return { workStart: DEFAULT_START, workEnd: DEFAULT_END, days: defaultDays() }
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

  // Standard-Fenster ändern (bleibt als Vorlage/Fallback erhalten).
  const setWorkStart = (workStart) => setPrefs((p) => ({ ...p, workStart }))
  const setWorkEnd = (workEnd) => setPrefs((p) => ({ ...p, workEnd }))

  // Ein einzelnes Wochentag-Fenster anpassen (z.B. Samstag kürzer, So aus).
  const setDay = (wd, patch) =>
    setPrefs((p) => ({
      ...p,
      days: { ...p.days, [wd]: { ...p.days[wd], ...patch } },
    }))

  // „Alle Werktage gleich": Mo–Fr auf ein Fenster setzen (und aktivieren).
  const applyToWorkdays = ({ start, end }) =>
    setPrefs((p) => {
      const days = { ...p.days }
      for (const wd of [1, 2, 3, 4, 5]) days[wd] = { enabled: true, start, end }
      return { ...p, workStart: start, workEnd: end, days }
    })

  // Fenster eines Wochentags abrufen → { start, end } oder null (kein Arbeitstag).
  const windowForWeekday = (wd) => {
    const d = prefs.days?.[wd]
    if (!d || !d.enabled) return null
    return { start: d.start, end: d.end }
  }

  return {
    ...prefs,
    setWorkStart,
    setWorkEnd,
    setDay,
    applyToWorkdays,
    windowForWeekday,
  }
}

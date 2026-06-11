// Wiederholungs-Logik an einer Stelle.
//
// `repeat` ist ein String am Task-Objekt:
//   null            – einmalig
//   'daily'         – jeden Tag
//   'weekdays'      – Mo–Fr
//   'weekly'        – jede Woche (gleicher Wochentag)
//   'biweekly'      – alle 2 Wochen
//   'days:1,3,5'    – bestimmte Wochentage (0 = So … 6 = Sa)
//
// Beim Abhaken legt useTasks automatisch die nächste Instanz an; `nextDueDate`
// rechnet deren Fälligkeit aus.

import { isoInDays, addDaysToISO, toISODate } from './date.js'

// Wochentage in Anzeige-Reihenfolge (Mo zuerst); `n` ist der JS-getDay-Wert.
export const WEEKDAYS = [
  { n: 1, label: 'Mo' },
  { n: 2, label: 'Di' },
  { n: 3, label: 'Mi' },
  { n: 4, label: 'Do' },
  { n: 5, label: 'Fr' },
  { n: 6, label: 'Sa' },
  { n: 0, label: 'So' },
]

// Feste Voreinstellungen für die Chip-Reihe (ohne „Bestimmte Tage").
export const REPEAT_PRESETS = [
  { id: null, label: 'Einmalig' },
  { id: 'daily', label: 'Täglich' },
  { id: 'weekdays', label: 'Werktags' },
  { id: 'weekly', label: 'Wöchentlich' },
  { id: 'biweekly', label: 'Alle 2 Wochen' },
]

// Zerlegt einen 'days:...'-String in ein Set von Wochentagen.
export function parseDays(repeat) {
  if (typeof repeat !== 'string' || !repeat.startsWith('days:')) return []
  return repeat
    .slice(5)
    .split(',')
    .map(Number)
    .filter((n) => n >= 0 && n <= 6)
}

// Baut aus ausgewählten Wochentagen den Repeat-String (oder null, wenn leer).
export function buildDaysRepeat(days) {
  const clean = [...new Set(days)].filter((n) => n >= 0 && n <= 6).sort((a, b) => a - b)
  return clean.length ? `days:${clean.join(',')}` : null
}

// Wochentag (0–6) eines ISO-Datums.
function weekdayOf(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

// Nächster Tag NACH `baseISO`, dessen Wochentag in `set` liegt (max. +7).
function nextMatchingDay(baseISO, set) {
  for (let i = 1; i <= 7; i++) {
    const cand = addDaysToISO(baseISO, i)
    if (set.includes(weekdayOf(cand))) return cand
  }
  return addDaysToISO(baseISO, 1)
}

// Fälligkeit der nächsten Instanz. Basis ist die bisherige Fälligkeit oder
// — falls keine gesetzt war — heute.
export function nextDueDate(dueDate, repeat) {
  const base = dueDate ?? toISODate(new Date())

  if (repeat === 'daily') return dueDate ? addDaysToISO(dueDate, 1) : isoInDays(1)
  if (repeat === 'weekly') return dueDate ? addDaysToISO(dueDate, 7) : isoInDays(7)
  if (repeat === 'biweekly') return dueDate ? addDaysToISO(dueDate, 14) : isoInDays(14)
  if (repeat === 'weekdays') return nextMatchingDay(base, [1, 2, 3, 4, 5])
  if (typeof repeat === 'string' && repeat.startsWith('days:')) {
    const set = parseDays(repeat)
    return set.length ? nextMatchingDay(base, set) : addDaysToISO(base, 1)
  }
  // Unbekannt → wie täglich behandeln (defensiv).
  return dueDate ? addDaysToISO(dueDate, 1) : isoInDays(1)
}

// Kurzes Label für die Anzeige (Tooltip/Screenreader auf der Karte).
export function repeatLabel(repeat) {
  if (!repeat) return null
  const preset = REPEAT_PRESETS.find((r) => r.id === repeat)
  if (preset) return preset.label
  if (repeat.startsWith('days:')) {
    const labels = parseDays(repeat).map(
      (n) => WEEKDAYS.find((w) => w.n === n)?.label,
    )
    return labels.join(', ')
  }
  return null
}

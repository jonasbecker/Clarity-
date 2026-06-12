// Baut den Wochenplan aus den KI-Tag-Zuweisungen.
//
// Im Gegensatz zu buildWeek (reine Überlauf-Verteilung) bestimmt hier die KI,
// an welchem Tag eine Task landet. Das *Wann genau* (Uhrzeit) rechnet weiter
// der deterministische Scheduler je Tag. Passt eine Task an ihrem zugewiesenen
// Tag nicht mehr rein, rutscht sie wie gewohnt auf den nächsten Tag.

import { buildSchedule } from './scheduler.js'

// Freie Minuten eines Tages im Arbeitsfenster (nach Abzug der Termine).
// Wird für die KI-Anfrage gebraucht, damit sie die Last verteilen kann.
export function freeMinutes(events, workStart, workEnd) {
  const toMin = (s) => {
    const [h, m] = String(s).split(':').map(Number)
    return h * 60 + m
  }
  const dayStart = toMin(workStart)
  const dayEnd = toMin(workEnd)
  let busy = 0
  for (const e of events) {
    if (e.allDay || !e.start || !e.end) continue
    const s = Math.max(dayStart, toMin(e.start))
    const en = Math.min(dayEnd, toMin(e.end))
    if (en > s) busy += en - s
  }
  return Math.max(0, dayEnd - dayStart - busy)
}

// Verteilt die (global geordneten) Tasks anhand der KI-Zuweisungen auf die
// Tage und plant jeden Tag mit dem Scheduler.
//
// Rückgabe: { days: [{ offset, events, blocks }], unscheduled }
export function buildAiWeek({
  ordered,
  dayEvents = [],
  assignments = [],
  dayWindows = null,
  workStart = '09:00',
  workEnd = '18:00',
  dayCount = 5,
  now = null,
}) {
  // id → zugewiesener Tag. Unbekannte Tasks landen auf Tag 0.
  const dayOf = new Map(assignments.map((a) => [a.id, a.day]))

  // Tasks je Tag in der globalen Reihenfolge sammeln.
  const buckets = Array.from({ length: dayCount }, () => [])
  for (const task of ordered) {
    const d = Math.min(dayCount - 1, Math.max(0, dayOf.get(task.id) ?? 0))
    buckets[d].push(task)
  }

  const days = []
  let carry = [] // was am Vortag nicht mehr reinpasste
  for (let d = 0; d < dayCount; d++) {
    const events = dayEvents[d] || []
    const win =
      dayWindows && d in dayWindows ? dayWindows[d] : { workStart, workEnd }
    // Arbeitsfreier Tag: alles auf den nächsten Tag übertragen.
    if (!win) {
      days.push({ offset: d, events, blocks: [], off: true })
      carry = [...carry, ...buckets[d]]
      continue
    }
    // Übertrag zuerst (dringlicher), dann die für heute geplanten Tasks.
    const { blocks, unscheduled } = buildSchedule({
      tasks: [...carry, ...buckets[d]],
      events,
      workStart: win.workStart,
      workEnd: win.workEnd,
      now: d === 0 ? now : null,
    })
    days.push({ offset: d, events, blocks })
    carry = unscheduled
  }

  return { days, unscheduled: carry }
}

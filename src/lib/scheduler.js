// Der Auto-Scheduler — das Herzstück des "KI-Kalenders".
//
// Reine Funktion, kein State, keine Seiteneffekte: gegeben eine geordnete
// Task-Liste (jeweils mit geschätzter Dauer), die fixen Termine des Tages
// und ein Arbeitszeit-Fenster, legt sie jede Task in die nächste freie
// Lücke. Die KI entscheidet nur die *Reihenfolge* und *Dauer* — *wann*
// genau (Uhrzeit) bestimmt dieser deterministische Algorithmus rund um die
// echten Termine. Das macht das Ergebnis nachvollziehbar und verlässlich.

const DEFAULT_DURATION = 30
const MAX_DURATION = 8 * 60

// "09:00" -> 540 (Minuten seit Mitternacht).
export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

// 540 -> "09:00".
export function toHHMM(min) {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// Dauer absichern (positiv, im Tagesrahmen). Fehlt sie, nehmen wir 30 Min.
export function clampDuration(d) {
  const n = Number(d)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_DURATION
  return Math.min(MAX_DURATION, Math.round(n))
}

// "1h 30m", "45m" — menschenlesbare Dauer.
export function formatDuration(min) {
  const m = clampDuration(min)
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (h && rest) return `${h} h ${rest} min`
  if (h) return `${h} h`
  return `${rest} min`
}

// Überlappende/aneinandergrenzende Belegt-Zeiten zu einer Liste verschmelzen.
function mergeBusy(intervals) {
  const sorted = intervals
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start)
  const merged = []
  for (const b of sorted) {
    const last = merged[merged.length - 1]
    if (last && b.start <= last.end) last.end = Math.max(last.end, b.end)
    else merged.push({ ...b })
  }
  return merged
}

// Aus Terminen + Arbeitsfenster die freien Lücken (in Minuten) bestimmen.
function freeGaps(events, dayStart, dayEnd) {
  const busy = mergeBusy(
    events
      .filter((e) => !e.allDay && e.start && e.end)
      .map((e) => ({ start: toMinutes(e.start), end: toMinutes(e.end) })),
  )

  const gaps = []
  let cursor = dayStart
  for (const b of busy) {
    if (b.end <= cursor) continue
    if (b.start > cursor) gaps.push({ start: cursor, end: Math.min(b.start, dayEnd) })
    cursor = Math.max(cursor, b.end)
    if (cursor >= dayEnd) break
  }
  if (cursor < dayEnd) gaps.push({ start: cursor, end: dayEnd })
  return gaps.filter((g) => g.end > g.start)
}

// Baut den Tagesplan.
//
// Parameter:
//   tasks      – bereits geordnete offene Tasks (wichtigste zuerst)
//   events     – fixe Termine (mit start/end "HH:MM" oder allDay)
//   workStart  – "09:00"
//   workEnd    – "18:00"
//   now        – aktuelle Uhrzeit als Minuten (optional; plant ab jetzt)
//
// Rückgabe: { blocks, unscheduled }
//   blocks      – [{ task, start, end }] (start/end in Minuten)
//   unscheduled – Tasks, die heute nicht mehr reinpassen
export function buildSchedule({ tasks = [], events = [], workStart = '09:00', workEnd = '18:00', now = null }) {
  const dayStart = toMinutes(workStart)
  const dayEnd = toMinutes(workEnd)

  // Ab jetzt planen, wenn wir mitten im Arbeitsfenster sind — sonst den
  // ganzen Tag ab Arbeitsbeginn (z.B. abends die Planung für morgen ansehen).
  let start = dayStart
  if (now != null && now > dayStart && now < dayEnd) {
    start = Math.ceil(now / 5) * 5 // auf 5 Minuten aufrunden
  }

  if (dayEnd <= start) {
    return { blocks: [], unscheduled: tasks.slice() }
  }

  const gaps = freeGaps(events, start, dayEnd)

  // Tasks STRENG in ihrer Reihenfolge platzieren: jede beginnt frühestens am
  // Ende der vorigen (cursor). So entspricht die zeitliche Abfolge im Plan
  // genau der Prioritäts-Reihenfolge — wichtig fürs manuelle Umsortieren.
  // Eine Task, die nicht mehr passt, blockiert spätere kürzere nicht (der
  // cursor wandert nur beim tatsächlichen Platzieren weiter).
  const blocks = []
  const unscheduled = []
  let cursor = start
  for (const task of tasks) {
    const dur = clampDuration(task.duration_min)
    let placedAt = null
    for (const g of gaps) {
      const s = Math.max(cursor, g.start)
      if (s + dur <= g.end) {
        placedAt = s // gaps sind zeitlich sortiert → erster Treffer = frühest
        break
      }
    }
    if (placedAt == null) {
      unscheduled.push(task)
      continue
    }
    blocks.push({ task, start: placedAt, end: placedAt + dur })
    cursor = placedAt + dur
  }

  return { blocks, unscheduled }
}

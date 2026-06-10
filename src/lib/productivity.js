// Mustererkennung für die Statistik-Ansicht: aggregiert erledigte Tasks
// (mit `completed_at`) zu Bereichs-, Tageszeit- und Wochentag-Verteilungen
// sowie einem Wochentrend über die letzten `weeks` Wochen.

import { startOfWeek } from './date.js'

const TIME_BUCKETS = [
  { id: 'morning', label: 'Morgens', from: 5, to: 11 },
  { id: 'midday', label: 'Mittags', from: 11, to: 15 },
  { id: 'afternoon', label: 'Nachmittags', from: 15, to: 19 },
  { id: 'evening', label: 'Abends', from: 19, to: 5 },
]

// Abend ist über Mitternacht hinweg (19–5 Uhr) — daher die Sonderbehandlung.
function timeBucketFor(hour) {
  return TIME_BUCKETS.find((b) =>
    b.from < b.to ? hour >= b.from && hour < b.to : hour >= b.from || hour < b.to,
  )
}

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export function productivityStats(tasks, weeks = 6) {
  const completed = tasks.filter((t) => t.done && t.completed_at)

  const byArea = { study: 0, work: 0, private: 0 }
  const byTimeOfDay = TIME_BUCKETS.map((b) => ({ id: b.id, label: b.label, value: 0 }))
  const byWeekday = WEEKDAY_SHORT.map((label) => ({ label, value: 0 }))

  for (const t of completed) {
    const d = new Date(t.completed_at)
    if (byArea[t.area] != null) byArea[t.area] += 1
    byTimeOfDay.find((b) => b.id === timeBucketFor(d.getHours()).id).value += 1
    byWeekday[d.getDay()].value += 1
  }

  // Wochentrend: Anzahl Erledigungen je Woche, älteste zuerst.
  const weeklyTrend = []
  const today = new Date()
  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - i * 7),
    )
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const value = completed.filter((t) => {
      const d = new Date(t.completed_at)
      return d >= start && d < end
    }).length
    weeklyTrend.push({ label: `${start.getDate()}.${start.getMonth() + 1}.`, value })
  }

  const topTimeOfDay = byTimeOfDay.reduce((a, b) => (b.value > a.value ? b : a))
  const topWeekday = byWeekday.reduce(
    (best, b, i) => (b.value > byWeekday[best].value ? i : best),
    0,
  )

  return {
    total: completed.length,
    byArea,
    byTimeOfDay,
    byWeekday,
    weeklyTrend,
    bestTimeOfDay: topTimeOfDay.value > 0 ? topTimeOfDay.label : null,
    bestWeekday: byWeekday[topWeekday].value > 0 ? WEEKDAYS[topWeekday] : null,
  }
}

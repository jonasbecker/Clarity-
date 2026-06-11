import { formatDueLabel } from './date.js'

// Ruft unsere Server-Funktion /api/planweek auf (Wochen-Verteilung).
// Wie bei aiPlan.js sprechen die Komponenten nie direkt mit Groq.
export async function fetchAiWeek({ tasks, days }) {
  const res = await fetch('/api/planweek', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        area: t.area,
        due: formatDueLabel(t.due_date),
        duration_min: t.duration_min || undefined,
      })),
      days,
    }),
  })

  if (!res.ok) {
    let msg = `Server antwortete mit ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) msg = data.error
    } catch {
      if (res.status === 404)
        msg = 'KI ist nur auf der veröffentlichten Seite verfügbar.'
    }
    throw new Error(msg)
  }

  return res.json() // { assignments: [{id, day, reason}], summary }
}

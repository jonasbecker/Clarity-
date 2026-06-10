import { formatDueLabel } from './date.js'

// Ruft unsere eigene Server-Funktion /api/prioritize auf.
// Die Komponenten sprechen nie direkt mit Groq — nur mit unserem Backend.
export async function fetchAiPlan({ tasks, events }) {
  const res = await fetch('/api/prioritize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Wir schicken nur, was die KI braucht — schlank halten. Das Datum als
    // lesbares Label ("Heute", "Mi., 11. Juni"), damit die KI es versteht.
    body: JSON.stringify({
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        area: t.area,
        due: formatDueLabel(t.due_date),
        description: t.description || undefined,
        duration_min: t.duration_min || undefined,
      })),
      events: events.map((e) => ({ title: e.title, start: e.start, end: e.end })),
    }),
  })

  if (!res.ok) {
    let msg = `Server antwortete mit ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) msg = data.error
    } catch {
      // /api gibt es lokal (vite dev) nicht → freundlicher Hinweis.
      if (res.status === 404)
        msg = 'KI ist nur auf der veröffentlichten Seite verfügbar.'
    }
    throw new Error(msg)
  }

  return res.json() // { focus: [{id, reason}], schedule: [{id, duration_min, reason}], summary }
}

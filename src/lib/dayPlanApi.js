import { formatDueLabel } from './date.js'

// Ruft unsere Server-Funktion /api/dayplan auf (KI-Deep-Work-Auswahl). Wie bei
// aiPlan.js sprechen die Komponenten nie direkt mit Groq. Schickt nur das
// Nötige: Limit, Kurse (in Reihenfolge) und die offenen Aufgaben.
export async function fetchDayPlan({ availableMinutes, courses, tasks }) {
  const res = await fetch('/api/dayplan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      availableMinutes,
      courses: courses.map((c) => ({ id: c.id, name: c.name })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        course_id: t.course_id || null,
        duration_min: t.duration_min || undefined,
        due: formatDueLabel(t.due_date) || undefined,
      })),
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

  return res.json() // { selected: [{ id, reason }], summary }
}

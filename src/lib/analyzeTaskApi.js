// Ruft unsere Server-Funktion /api/analyzeTask auf (KI-Aufgaben-Analyse).
// Wie bei dayPlanApi.js spricht die Komponente nie direkt mit Groq.
export async function fetchTaskAnalysis({ title, courseName, text }) {
  const res = await fetch('/api/analyzeTask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, courseName, text }),
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

  return res.json() // { duration_min, priority, kind, summary }
}

import { formatDueLabel } from './date.js'
import { subtaskProgress } from './subtasks.js'

// Baut den schlanken Request-Body für den KI-Studiencoach und ruft unsere
// Server-Funktion /api/coach auf. Reine, testbare Aufbereitung — die
// Komponenten sprechen nie direkt mit Groq.
export function buildCoachBody(course, tasks) {
  const courseTasks = tasks.filter((t) => t.course_id === course.id && !t.done)
  const open = courseTasks.filter((t) => t.kind !== 'exam')
  const exams = courseTasks.filter((t) => t.kind === 'exam')
  const lectures = Array.isArray(course.lectures) ? course.lectures : []
  return {
    course: { name: course.name, semester: course.semester || undefined },
    tasks: open.map((t) => ({
      id: t.id,
      title: t.title,
      due: formatDueLabel(t.due_date),
      priority: t.priority || undefined,
    })),
    exams: exams.map((t) => {
      const p = subtaskProgress(t.subtasks)
      return {
        id: t.id,
        title: t.title,
        due: formatDueLabel(t.due_date),
        progress: p.total > 0 ? `${p.done}/${p.total}` : undefined,
      }
    }),
    lectureTitles: lectures.map((l) => l.title).filter(Boolean).slice(0, 20),
  }
}

export async function fetchCoach(course, tasks) {
  const res = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildCoachBody(course, tasks)),
  })

  if (!res.ok) {
    let msg = `Server antwortete mit ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) msg = data.error
    } catch {
      if (res.status === 404)
        msg = 'Der KI-Coach ist nur auf der veröffentlichten Seite verfügbar.'
    }
    throw new Error(msg)
  }

  return res.json() // { method, rationale, steps: [{ id?, title, reason }] }
}

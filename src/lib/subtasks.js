// Reine Helfer für Subtasks (Checklisten innerhalb einer Task).
// Subtasks liegen als Array `[{ id, title, done }]` am Task-Objekt — in
// Supabase als JSONB-Spalte, im Demo-Modus einfach Teil des Objekts.
// Alle Funktionen sind unveränderlich (geben ein neues Array zurück).

export function addSubtask(subtasks, title) {
  const trimmed = title.trim()
  if (!trimmed) return subtasks
  return [...subtasks, { id: crypto.randomUUID(), title: trimmed, done: false }]
}

export function toggleSubtask(subtasks, id) {
  return subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
}

export function removeSubtask(subtasks, id) {
  return subtasks.filter((s) => s.id !== id)
}

// Fortschritt als { done, total } — total 0, wenn keine Subtasks da sind.
export function subtaskProgress(subtasks) {
  const list = Array.isArray(subtasks) ? subtasks : []
  return { done: list.filter((s) => s.done).length, total: list.length }
}

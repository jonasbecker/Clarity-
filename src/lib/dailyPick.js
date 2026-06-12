// Deterministische Tagesauswahl („Deep Work"), als Fallback wenn keine KI
// verfügbar ist (Demo/lokal) und als Grundlogik:
//
// Die Kurse werden strikt von oben nach unten abgearbeitet (Galerie-/
// inserted_at-Reihenfolge). Pro Kurs werden dessen offene Aufgaben der Reihe
// nach aufgenommen, solange das harte Zeit-Limit (availableMinutes) nicht
// überschritten wird — so bündeln sich Aufgaben eines Fachs zu Blöcken, statt
// bunt zu mischen. Klausuren (kind='exam') sind Meilensteine und werden nicht
// eingeplant. Aufgaben ohne Kurs kommen zuletzt.
//
// Gibt die Liste der ausgewählten Aufgaben-ids zurück.
export function dailyPick({ courses = [], tasks = [], availableMinutes }) {
  const limit = Number(availableMinutes)
  if (!Number.isFinite(limit) || limit <= 0) return []

  const open = tasks.filter((t) => !t.done && t.kind !== 'exam')

  // Nach Kurs gruppieren; Reihenfolge der Aufgaben folgt der Eingabe.
  const byCourse = new Map()
  const uncoursed = []
  for (const t of open) {
    if (t.course_id) {
      if (!byCourse.has(t.course_id)) byCourse.set(t.course_id, [])
      byCourse.get(t.course_id).push(t)
    } else {
      uncoursed.push(t)
    }
  }

  // Kurse top-to-bottom, danach die kurslosen Aufgaben.
  const buckets = [...courses.map((c) => byCourse.get(c.id) || []), uncoursed]

  const ids = []
  let remaining = limit
  for (const bucket of buckets) {
    for (const t of bucket) {
      const dur = t.duration_min || 0
      if (dur <= remaining) {
        ids.push(t.id)
        remaining -= dur
      }
    }
  }
  return ids
}

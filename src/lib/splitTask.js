// Auto-Split: lange Aufgaben in machbare Brocken zerlegen. Niemand arbeitet 5
// Stunden am Stück konzentriert — darum kappt Clarity die Dauer hart bei
// MAX_CHUNK Minuten und zerschneidet längere Aufgaben automatisch.
//
// Reine Funktionen: `splitDuration` rechnet nur die Minuten-Brocken aus,
// `buildSplitTasks` baut daraus fertige Task-Feld-Objekte (wie `addTask` sie
// erwartet). Das tatsächliche Anlegen übernimmt der Aufrufer.

const MAX_CHUNK = 120 // hartes Limit je Aufgaben-Brocken (Minuten)

// Zerlegt `min` Minuten in Brocken à höchstens MAX_CHUNK. Beispiel:
//   300 → [120, 120, 60]   90 → [90]   240 → [120, 120]
// Gibt für ungültige/zu kleine Werte einen einzelnen, plausiblen Brocken zurück.
export function splitDuration(min) {
  const total = Math.floor(Number(min))
  if (!Number.isFinite(total) || total <= MAX_CHUNK) {
    return [total > 0 ? total : MAX_CHUNK]
  }
  const chunks = []
  let rest = total
  while (rest > 0) {
    chunks.push(Math.min(rest, MAX_CHUNK))
    rest -= MAX_CHUNK
  }
  return chunks
}

// Braucht diese Dauer überhaupt eine Teilung?
export function needsSplit(min) {
  return Number(min) > MAX_CHUNK
}

// Baut aus `fields` (ein Task-Feld-Objekt mit `duration_min` > MAX_CHUNK) eine
// Liste von Teil-Aufgaben „Titel – Teil 1/2/…". Alle übrigen Felder (Kurs,
// Tags, Fälligkeit, planned_date …) werden übernommen; Checkliste/Beschreibung
// nur beim ersten Teil, damit sie nicht vervielfacht werden.
export function buildSplitTasks(fields) {
  const chunks = splitDuration(fields.duration_min)
  if (chunks.length <= 1) return [fields]

  const base = String(fields.title || '').trim()
  return chunks.map((duration, i) => ({
    ...fields,
    title: `${base} – Teil ${i + 1}`,
    duration_min: duration,
    subtasks: i === 0 ? (fields.subtasks ?? []) : [],
    description: i === 0 ? (fields.description ?? null) : null,
  }))
}

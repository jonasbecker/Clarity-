// Serien-Generator: aus einem Basistitel mehrere durchnummerierte Aufgaben
// machen — z.B. „Aufgabenblatt" 1…12, alle auf denselben Kurs gebucht. Spart
// das zwölffache Eintippen.
//
// Reine Funktion: liefert nur die Task-Feld-Objekte (wie sie `addTask`
// erwartet) zurück; das tatsächliche Anlegen übernimmt der Aufrufer.

const MAX_SERIES = 60 // harte Obergrenze gegen Tippfehler („bis 9999")

// Baut die Aufgaben-Liste.
//
//   base       – Basistitel, z.B. „Aufgabenblatt"
//   from, to   – von/bis (inklusive), z.B. 1 bis 12
//   courseId   – Kurs, auf den alle gebucht werden (oder null)
//   durationMin– geschätzte Dauer je Aufgabe
//   area       – Bereich (Standard 'study')
//   kind       – 'task' (Serien sind nie Klausuren)
//
// Gibt [] zurück, wenn der Basistitel leer oder der Bereich ungültig ist.
export function buildSeries({
  base,
  from = 1,
  to = 1,
  courseId = null,
  durationMin = 30,
  area = 'study',
}) {
  const title = String(base || '').trim()
  if (!title) return []

  let start = Math.floor(Number(from))
  let end = Math.floor(Number(to))
  if (!Number.isFinite(start) || !Number.isFinite(end)) return []
  if (end < start) [start, end] = [end, start]
  // Auf die Obergrenze kappen, statt aus Versehen Hunderte anzulegen.
  end = Math.min(end, start + MAX_SERIES - 1)

  const items = []
  for (let n = start; n <= end; n++) {
    items.push({
      title: `${title} ${n}`,
      area,
      course_id: courseId,
      kind: 'task',
      duration_min: durationMin,
      due_date: null,
    })
  }
  return items
}

// Wie viele Aufgaben würde diese Eingabe erzeugen? (Für die Vorschau im
// Formular, ohne die Objekte schon zu bauen.)
export function seriesCount(from, to) {
  const start = Math.floor(Number(from))
  const end = Math.floor(Number(to))
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0
  const lo = Math.min(start, end)
  const hi = Math.min(Math.max(start, end), lo + MAX_SERIES - 1)
  return hi - lo + 1
}

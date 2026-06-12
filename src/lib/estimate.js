// Lernende Dauer-Schätzung.
//
// Idee: Du trägst beim Abhaken ein, wie lange eine Aufgabe TATSÄCHLICH
// gedauert hat (`actual_min`). Für neue, ähnliche Aufgaben schätzt Clarity
// die Dauer dann aus dem Durchschnitt deiner bisherigen Ist-Zeiten — so wird
// der Tagesplan mit der Zeit immer realistischer.
//
// „Ähnlich" heißt: gleicher Kurs UND gleicher Titel-Kern. Der Titel-Kern
// entsteht, indem wir die laufende Nummer (und Ähnliches) abschneiden:
//   "Mathe Aufgabenblatt 3"  → "mathe aufgabenblatt"
//   "Übungsblatt Nr. 12"     → "übungsblatt"
//   "Kapitel IV lesen"       → "kapitel lesen"
// Reine Funktionen, kein State — leicht testbar.

const DEFAULT_DURATION = 30

// Titel auf seinen Kern reduzieren: klein schreiben, führende Zähl-Wörter
// (Nr./Teil/Kapitel/Aufgabe …) und Nummern (arabisch wie römisch) entfernen,
// Mehrfach-Leerzeichen glätten.
export function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/\b(nr\.?|nummer|teil|kapitel|aufgabe|blatt|woche|tag|kw)\b/g, ' ')
    .replace(/\b[ivxlcdm]+\b/g, ' ') // römische Zahlen als eigenständige Wörter
    .replace(/[#0-9]+/g, ' ') // arabische Zahlen / Rauten
    .replace(/[.,:;_\-–—()[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Median ist robuster gegen einzelne Ausreißer als der Mittelwert
// (ein Tag, an dem du dich verzettelt hast, verzerrt die Schätzung nicht).
function median(nums) {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

// Auf 5 Minuten runden, in den Tagesrahmen klemmen.
function round5(min) {
  const n = Math.round(min / 5) * 5
  return Math.min(1440, Math.max(5, n))
}

// Schätzt die Dauer (Minuten) für eine neue Aufgabe aus deinen Ist-Zeiten.
//
//   title     – Titel der neuen Aufgabe
//   courseId  – zugeordneter Kurs (oder null)
//   tasks     – alle (bekannten) Tasks; herangezogen werden nur erledigte
//               mit erfasster Ist-Zeit
//   fallback  – Rückgabe, wenn es keine Vergleichsdaten gibt (Standard 30)
//
// Vorgehen: erst exakt (gleicher Kurs + gleicher Titel-Kern), dann nur über
// den Titel-Kern (kursübergreifend). Findet sich nichts, kommt der Fallback.
export function estimateMinutes(title, courseId, tasks = [], fallback = DEFAULT_DURATION) {
  const key = normalizeTitle(title)
  if (!key) return fallback

  const done = tasks.filter(
    (t) => t.done && Number(t.actual_min) > 0 && normalizeTitle(t.title) === key,
  )
  if (done.length === 0) return fallback

  const sameCourse = courseId
    ? done.filter((t) => t.course_id === courseId)
    : []
  const pool = sameCourse.length > 0 ? sameCourse : done

  return round5(median(pool.map((t) => Number(t.actual_min))))
}

// Gibt es überhaupt Vergleichsdaten? (Für UI-Hinweise „geschätzt aus deinen
// bisherigen Zeiten" statt eines stillen Standardwerts.)
export function hasEstimateBasis(title, courseId, tasks = []) {
  const key = normalizeTitle(title)
  if (!key) return false
  return tasks.some(
    (t) => t.done && Number(t.actual_min) > 0 && normalizeTitle(t.title) === key,
  )
}

// Erledigte Tasks mit Ist-Zeit, die den gegebenen Kategorie-Tag tragen
// (case-insensitive) — Grundlage für die kategorie-basierte Schätzung.
function doneWithCategory(category, tasks) {
  if (!category) return []
  const key = category.toLowerCase()
  return tasks.filter(
    (t) =>
      t.done &&
      Number(t.actual_min) > 0 &&
      Array.isArray(t.tags) &&
      t.tags.some((tag) => String(tag).toLowerCase() === key),
  )
}

// Schätzt die Dauer aus deinen bisherigen Ist-Zeiten für Aufgaben derselben
// Kategorie (z.B. "Rechenaufgabe") — unabhängig vom Titel. Ergänzt
// `estimateMinutes`, die nur auf Titel-Ähnlichkeit schaut: ein neues
// Übungsblatt mit anderem Titel, aber gleicher Kategorie, profitiert so von
// deinen bisherigen Zeiten.
export function estimateMinutesByCategory(category, courseId, tasks = [], fallback = DEFAULT_DURATION) {
  const done = doneWithCategory(category, tasks)
  if (done.length === 0) return fallback

  const sameCourse = courseId ? done.filter((t) => t.course_id === courseId) : []
  const pool = sameCourse.length > 0 ? sameCourse : done

  return round5(median(pool.map((t) => Number(t.actual_min))))
}

// Gibt es Vergleichsdaten für diese Kategorie?
export function hasCategoryEstimateBasis(category, courseId, tasks = []) {
  return doneWithCategory(category, tasks).length > 0
}

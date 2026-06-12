// Deterministischer Fallback für die KI-Aufgaben-Analyse (kein Groq-Key/
// Fehler — die Funktion bleibt nutzbar). Schätzt aus Titel + extrahiertem
// Text: Dauer (Minuten, 15er-Schritte), Schwierigkeit (→ Priorität), Art
// (Aufgabe/Klausur) und Aufgabentyp-Kategorie (Operatoren-basiert).

import { detectOperators, estimateCategory } from './operators.js'

const EXAM_WORDS = ['klausur', 'prüfung', 'exam', 'test']
const HARD_WORDS = ['klausur', 'prüfung', 'abgabe', 'frist', 'deadline', 'beweis', 'projekt']

// Grobe Heuristik: ~12 Wörter Aufgabentext ≈ 5 Minuten Bearbeitung,
// mindestens 15, gerundet auf 15-Min-Schritte.
export function estimateDuration(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 15
  const raw = Math.max(15, Math.round((words / 12) * 5))
  return Math.round(raw / 15) * 15
}

// Operatoren zeigen den Anforderungsbereich: AB III (beurteilen, diskutieren
// …) macht eine Aufgabe schwer, reine AB-I-Operatoren (nennen, beschreiben
// …) bei kurzem Text eher leicht.
export function estimatePriority(title, text) {
  const haystack = `${title} ${text}`.toLowerCase()
  if (HARD_WORDS.some((w) => haystack.includes(w))) return 'high'

  const ops = detectOperators(text)
  if (ops.some((o) => o.level === 'III')) return 'high'

  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (ops.length > 0 && ops.every((o) => o.level === 'I') && words <= 150) return 'low'
  return words > 150 ? 'medium' : 'low'
}

export function estimateKind(title, text) {
  const haystack = `${title} ${text}`.toLowerCase()
  return EXAM_WORDS.some((w) => haystack.includes(w)) ? 'exam' : 'task'
}

// Erster sinnvolle Satz/Zeile aus dem Text als kurze Zusammenfassung.
export function estimateSummary(text) {
  const line = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  if (!line) return ''
  const sentence = line.split(/(?<=[.!?])\s/)[0]
  return sentence.slice(0, 150)
}

export function analyzeTaskFallback({ title = '', text = '' }) {
  return {
    duration_min: estimateDuration(text),
    priority: estimatePriority(title, text),
    kind: estimateKind(title, text),
    category: estimateCategory(title, text),
    summary: estimateSummary(text),
  }
}

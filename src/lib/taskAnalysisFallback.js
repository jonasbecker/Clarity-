// Deterministischer Fallback für die KI-Aufgaben-Analyse (kein Groq-Key/
// Fehler — die Funktion bleibt nutzbar). Schätzt aus Titel + extrahiertem
// Text: Dauer (Minuten, 15er-Schritte), Schwierigkeit (→ Priorität), Art
// (Aufgabe/Klausur) und Kategorie (für die kategorie-basierte Lernschätzung).

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

export function estimatePriority(title, text) {
  const haystack = `${title} ${text}`.toLowerCase()
  if (HARD_WORDS.some((w) => haystack.includes(w))) return 'high'

  const words = text.trim().split(/\s+/).filter(Boolean).length
  const counts = { I: 0, II: 0, III: 0 }
  for (const { level } of detectOperators(haystack)) counts[level]++

  // AB III-Verben (beurteilen, diskutieren, …) überwiegen → anspruchsvoll.
  if (counts.III > 0 && counts.III >= counts.I && counts.III >= counts.II) return 'high'

  // Nur AB I-Verben (Reproduktion) bei kurzem Text → leicht.
  if (counts.I > 0 && counts.II === 0 && counts.III === 0 && words <= 150) return 'low'

  // Keine erkannten Operatoren: wie bisher nach Textlänge schätzen.
  if (counts.I === 0 && counts.II === 0 && counts.III === 0) {
    return words > 150 ? 'medium' : 'low'
  }

  return 'medium'
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

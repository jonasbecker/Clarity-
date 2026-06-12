// Operatoren der Bildungsstandards (Arbeitsanweisungen wie „nenne",
// „berechne", „beurteile") und einfache Aufgabentyp-Kategorien.
//
// Operatoren zeigen den Anforderungsbereich (AB) einer Aufgabe an:
//   AB I   – Reproduktion (nennen, beschreiben, definieren …)
//   AB II  – Reorganisation/Transfer (erklären, berechnen, anwenden …)
//   AB III – Reflexion/Bewertung (beurteilen, diskutieren, interpretieren …)
//
// Reine Funktionen, kein State — leicht testbar. Wortstämme statt ganzer
// Wörter, damit Konjugationen ("berechne", "berechnen", "berechnet") erfasst
// werden.

export const AB_I_STEMS = [
  'nenn', 'beschreib', 'definier', 'wiedergeb', 'aufzähl', 'benenn',
  'skizzier', 'notier', 'angeb', 'list',
]

export const AB_II_STEMS = [
  'erklär', 'berechn', 'bestimm', 'analysier', 'untersuch', 'vergleich',
  'anwend', 'zuordn', 'ordne', 'übertrag', 'ableit', 'begründ', 'zeig',
  'zeichn', 'darstell', 'lös', 'ermittl', 'vereinfach',
]

export const AB_III_STEMS = [
  'beurteil', 'bewert', 'diskutier', 'erörter', 'interpretier',
  'stellungnahm', 'reflektier', 'entwickl', 'entwerf', 'kritisier',
]

// Aufgabentyp-Kategorien, gleiche Liste wird in api/analyzeTask.js als
// Whitelist für die KI-Antwort dupliziert.
export const CATEGORIES = [
  'Multiple Choice',
  'Rechenaufgabe',
  'Anwendungsaufgabe',
  'Wissensfrage',
  'Diskussion',
]

const CALC_STEMS = ['berechn', 'bestimm', 'lös', 'ermittl', 'vereinfach']
const APPLY_STEMS = ['anwend', 'übertrag', 'zuordn', 'ordne']
const MC_PATTERN = /[☐☑□]|kreuz|richtig oder falsch|wahr oder falsch|multiple choice|welche der folgenden|wähle die richtige/
// Separables „anwenden" (z.B. „wende das Verfahren an") fängt das Wortstamm-
// Matching nicht — daher zusätzlich als Muster prüfen.
const APPLY_PATTERN = /\bwende\b[^.!?]*\ban\b|\bwende\s+an\b/

function words(text) {
  return String(text).toLowerCase().match(/[a-zäöüß]+/g) || []
}

// Findet alle erkannten Operatoren mit ihrem Anforderungsbereich.
export function detectOperators(text) {
  const found = []
  for (const word of words(text)) {
    if (AB_I_STEMS.some((s) => word.startsWith(s))) found.push({ word, level: 'I' })
    else if (AB_II_STEMS.some((s) => word.startsWith(s))) found.push({ word, level: 'II' })
    else if (AB_III_STEMS.some((s) => word.startsWith(s))) found.push({ word, level: 'III' })
  }
  return found
}

// Schätzt den Aufgabentyp aus Titel + Inhalt — erst Muster-Check (Multiple
// Choice), dann dominanten Operator-Typ.
export function estimateCategory(title, text) {
  const haystack = `${title} ${text}`.toLowerCase()
  if (MC_PATTERN.test(haystack)) return 'Multiple Choice'

  let calc = 0
  let apply = APPLY_PATTERN.test(haystack) ? 1 : 0
  let discuss = 0
  for (const word of words(haystack)) {
    if (CALC_STEMS.some((s) => word.startsWith(s))) calc++
    if (APPLY_STEMS.some((s) => word.startsWith(s))) apply++
    if (AB_III_STEMS.some((s) => word.startsWith(s))) discuss++
  }

  if (discuss > 0 && discuss >= calc && discuss >= apply) return 'Diskussion'
  if (calc > 0 && calc >= apply) return 'Rechenaufgabe'
  if (apply > 0) return 'Anwendungsaufgabe'
  return 'Wissensfrage'
}

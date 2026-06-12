// Operatoren der Bildungsstandards (Verben wie „nenne", „berechne",
// „beurteile") zeigen den Anforderungsbereich (AB I–III) einer Aufgabe an:
//
//   AB I   – Reproduktion (Wissen wiedergeben)
//   AB II  – Reorganisation/Anwendung (Wissen übertragen, anwenden)
//   AB III – Reflexion/Bewertung (Wissen einordnen, beurteilen)
//
// Reine Funktionen, kein State — leicht testbar.

// Operator → Wortstamm (deckt Imperativ/Infinitiv/Personalformen ab, z.B.
// "berechn" trifft "berechne", "berechnen", "berechnet" …) → Anforderungsbereich.
const OPERATOR_ENTRIES = [
  // AB I — Reproduktion
  { operator: 'nennen', stem: 'nenn', level: 'I' },
  { operator: 'benennen', stem: 'benenn', level: 'I' },
  { operator: 'beschreiben', stem: 'beschreib', level: 'I' },
  { operator: 'definieren', stem: 'definier', level: 'I' },
  { operator: 'wiedergeben', stem: 'wiedergeb', level: 'I' },
  { operator: 'aufzählen', stem: 'aufzähl', level: 'I' },
  { operator: 'angeben', stem: 'angeb', level: 'I' },
  { operator: 'zusammenfassen', stem: 'zusammenfass', level: 'I' },
  { operator: 'skizzieren', stem: 'skizzier', level: 'I' },

  // AB II — Reorganisation/Anwendung
  { operator: 'erklären', stem: 'erklär', level: 'II' },
  { operator: 'berechnen', stem: 'berechn', level: 'II' },
  { operator: 'bestimmen', stem: 'bestimm', level: 'II' },
  { operator: 'ermitteln', stem: 'ermitt', level: 'II' },
  { operator: 'analysieren', stem: 'analysier', level: 'II' },
  { operator: 'anwenden', stem: 'anwend', level: 'II' },
  { operator: 'vergleichen', stem: 'vergleich', level: 'II' },
  { operator: 'begründen', stem: 'begründ', level: 'II' },
  { operator: 'untersuchen', stem: 'untersuch', level: 'II' },
  { operator: 'erläutern', stem: 'erläuter', level: 'II' },
  { operator: 'übertragen', stem: 'übertrag', level: 'II' },

  // AB III — Reflexion/Bewertung
  { operator: 'beurteilen', stem: 'beurteil', level: 'III' },
  { operator: 'bewerten', stem: 'bewert', level: 'III' },
  { operator: 'diskutieren', stem: 'diskutier', level: 'III' },
  { operator: 'erörtern', stem: 'erörter', level: 'III' },
  { operator: 'interpretieren', stem: 'interpretier', level: 'III' },
  { operator: 'reflektieren', stem: 'reflektier', level: 'III' },
  { operator: 'entwickeln', stem: 'entwick', level: 'III' },
  { operator: 'stellung nehmen', stem: 'stellung nehm', level: 'III' },
]

export const OPERATORS = OPERATOR_ENTRIES.reduce((map, { operator, level }) => {
  map[operator] = level
  return map
}, {})

export const CATEGORIES = [
  'Multiple Choice',
  'Rechenaufgabe',
  'Anwendungsaufgabe',
  'Wissensfrage',
  'Diskussion',
]

// "Rechen-Verben" (Teilmenge von AB II) → Indiz für "Rechenaufgabe".
const CALC_OPERATORS = new Set(['berechnen', 'bestimmen', 'ermitteln'])
// "anwenden"/"übertragen" → Indiz für "Anwendungsaufgabe".
const APPLY_OPERATORS = new Set(['anwenden', 'übertragen'])

// Hinweise auf Ankreuz-/Multiple-Choice-Aufgaben (Kästchen, "richtig oder
// falsch" usw.) — unabhängig von Operatoren.
const MULTIPLE_CHOICE_PATTERN = new RegExp(
  [
    'ankreuz', // "Ankreuzfeld", "ankreuzen"
    'kreuz\\w*[\\s\\S]{0,25}(richtig|\\ban\\b)', // "Kreuze die richtige Antwort an"
    'multiple[\\s-]?choice',
    'richtig\\s+oder\\s+falsch',
    'wahr\\s+oder\\s+falsch',
    'ja\\s*/\\s*nein',
    '[☐☑□]', // Kästchen-Symbole
    '\\[\\s?\\]', // "[ ]" / "[]" als Ankreuzfeld
  ].join('|'),
  'i',
)

// Deutsche Wortzeichen für eine eigene "Wortgrenze" — das eingebaute \b
// erkennt Umlaute (ä, ö, ü, ß) nicht als Wortzeichen und würde Stämme wie
// "übertrag" oder "erläuter" am Wortanfang verfehlen.
const DE_WORD_CHARS = 'a-zA-ZäöüÄÖÜß'

// Findet alle im Text vorkommenden Operatoren (case-insensitive, anhand der
// Wortstämme). Gibt für jeden gefundenen Operator { operator, level } zurück.
export function detectOperators(text) {
  const haystack = String(text || '').toLowerCase()
  const found = []
  for (const { operator, stem, level } of OPERATOR_ENTRIES) {
    const pattern = stem.includes(' ')
      ? stem.replace(/\s+/g, '\\s+')
      : `(?<![${DE_WORD_CHARS}])${stem}[${DE_WORD_CHARS}]*`
    if (new RegExp(pattern, 'i').test(haystack)) {
      found.push({ operator, level })
    }
  }
  return found
}

// Schätzt die Aufgaben-Kategorie aus Titel + Inhalt: erst ein einfacher
// Muster-Check (Ankreuzfelder etc.), sonst der dominante Operator-Typ.
export function estimateCategory(title = '', text = '') {
  const haystack = `${title} ${text}`

  if (MULTIPLE_CHOICE_PATTERN.test(haystack)) return 'Multiple Choice'

  const ops = detectOperators(haystack)
  const counts = { Rechenaufgabe: 0, Anwendungsaufgabe: 0, Diskussion: 0 }
  for (const { operator, level } of ops) {
    if (CALC_OPERATORS.has(operator)) counts.Rechenaufgabe++
    if (APPLY_OPERATORS.has(operator)) counts.Anwendungsaufgabe++
    if (level === 'III') counts.Diskussion++
  }

  let best = null
  for (const category of ['Rechenaufgabe', 'Anwendungsaufgabe', 'Diskussion']) {
    if (counts[category] > 0 && (!best || counts[category] > counts[best])) best = category
  }
  return best ?? 'Wissensfrage'
}

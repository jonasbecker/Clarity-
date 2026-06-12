// Vercel Serverless Function: /api/analyzeTask
//
// KI-Aufgaben-Analyse: aus Titel + Inhalt einer hochgeladenen Datei (Übungs-
// blatt, Aufgabenstellung, Skript-Ausschnitt) schätzt die KI Dauer,
// Schwierigkeit (→ Priorität) und Art (Aufgabe/Klausur). Läuft auf dem SERVER,
// damit der geheime GROQ_API_KEY hier liegen darf (ohne VITE_-Präfix).
// Antwort streng JSON. Die Datei selbst wird nicht gespeichert — nur der
// (clientseitig bereits gekappte) Text wird verarbeitet und danach verworfen.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

const PRIORITIES = new Set(['low', 'medium', 'high'])
const KINDS = new Set(['task', 'exam'])
// Aufgabentyp-Kategorien, gleiche Liste wie src/lib/operators.js (CATEGORIES).
const CATEGORIES = new Set([
  'Multiple Choice',
  'Rechenaufgabe',
  'Anwendungsaufgabe',
  'Wissensfrage',
  'Diskussion',
])

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt' })
  }
  if (!process.env.GROQ_API_KEY) {
    return res
      .status(500)
      .json({ error: 'GROQ_API_KEY ist auf dem Server nicht gesetzt.' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  const title = String(body?.title || '').slice(0, 200)
  const courseName = String(body?.courseName || '').slice(0, 100)
  const text = String(body?.text || '').slice(0, 6000)

  if (!title && !text) {
    return res.status(200).json({
      duration_min: null,
      priority: null,
      kind: null,
      category: null,
      summary: '',
    })
  }

  const system =
    'Du bist ein erfahrener Lerncoach. Du schätzt anhand des Titels und ' +
    'Inhalts einer Aufgabenstellung, wie lange ein Studierender braucht, wie ' +
    'schwierig sie ist, um welche Art von Aufgabe es sich handelt und in ' +
    'welche Kategorie sie fällt. Achte dabei besonders auf die verwendeten ' +
    'Operatoren (Arbeitsanweisungen): Operatoren wie "nenne", "beschreibe" ' +
    'oder "definiere" stehen für Anforderungsbereich I (Reproduktion, eher ' +
    'leicht), "erkläre", "berechne", "bestimme", "wende an" oder ' +
    '"vergleiche" für Anforderungsbereich II (Transfer, mittel), und ' +
    '"beurteile", "bewerte", "diskutiere" oder "interpretiere" für ' +
    'Anforderungsbereich III (Reflexion, eher schwer). Antworte ' +
    'AUSSCHLIESSLICH mit gültigem JSON, ohne Fließtext.'

  const user = `Titel der Aufgabe: ${title || '(kein Titel)'}
${courseName ? `Kurs: ${courseName}\n` : ''}
Inhalt (z.B. aus einem hochgeladenen Übungsblatt, ggf. gekürzt):
"""
${text || '(kein Inhalt)'}
"""

Schätze:
- "duration_min": realistische Bearbeitungsdauer in Minuten (ganze Zahl,
  zwischen 5 und 480).
- "priority": Schwierigkeit als "low" (leicht), "medium" (mittel) oder
  "high" (schwer) — leite das u.a. aus den verwendeten Operatoren ab.
- "kind": "exam" wenn es sich um eine Klausur/Prüfung handelt, sonst "task".
- "category": Aufgabentyp, genau eines von "Multiple Choice",
  "Rechenaufgabe", "Anwendungsaufgabe", "Wissensfrage" oder "Diskussion".
- "summary": ein knapper, sachlicher Satz (max. 15 Wörter, Deutsch), was die
  Aufgabe inhaltlich umfasst.

Antworte exakt in diesem JSON-Format:
{ "duration_min": <Zahl>, "priority": "low"|"medium"|"high", "kind": "task"|"exam", "category": "Multiple Choice"|"Rechenaufgabe"|"Anwendungsaufgabe"|"Wissensfrage"|"Diskussion", "summary": "<Satz>" }`

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })

    if (!groqRes.ok) {
      const detail = await groqRes.text().catch(() => '')
      return res
        .status(502)
        .json({ error: `KI-Dienst antwortete mit ${groqRes.status}`, detail })
    }

    const data = await groqRes.json()
    const content = data?.choices?.[0]?.message?.content || '{}'
    let result
    try {
      result = JSON.parse(content)
    } catch {
      return res.status(502).json({ error: 'KI-Antwort war kein gültiges JSON.' })
    }

    // Defensiv säubern: nur erwartete Werte, sonst null (Fallback übernimmt).
    const duration = Math.round(Number(result.duration_min))
    const duration_min =
      Number.isFinite(duration) && duration >= 5 && duration <= 480 ? duration : null
    const priority = PRIORITIES.has(result.priority) ? result.priority : null
    const kind = KINDS.has(result.kind) ? result.kind : null
    const category = CATEGORIES.has(result.category) ? result.category : null
    const summary = typeof result.summary === 'string' ? result.summary.slice(0, 200) : ''

    return res.status(200).json({ duration_min, priority, kind, category, summary })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unbekannter Fehler' })
  }
}

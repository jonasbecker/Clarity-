// Vercel Serverless Function: /api/coach
//
// Läuft auf dem SERVER (nicht im Browser) — deshalb darf hier der geheime
// Groq-API-Key liegen. Die App schickt einen Kurs samt offenen Aufgaben,
// Klausuren und Vorlesungs-Titeln; wir fragen die KI nach der effizientesten
// Lernmethode für genau diesen Kurs und einer priorisierten Schrittliste.
//
// Gleiches Muster und dieselbe Umgebungsvariable wie /api/prioritize:
// GROQ_API_KEY (ohne VITE_-Präfix), GROQ_MODEL optional.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

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
  const course = body?.course && typeof body.course === 'object' ? body.course : {}
  const tasks = Array.isArray(body?.tasks) ? body.tasks : []
  const exams = Array.isArray(body?.exams) ? body.exams : []
  const lectureTitles = Array.isArray(body?.lectureTitles) ? body.lectureTitles : []

  const system =
    'Du bist ein erfahrener, motivierender Lerncoach an der Uni. Du kennst ' +
    'effektive Lernmethoden (Active Recall, Spaced Repetition, Übungsaufgaben, ' +
    'Altklausuren, Zusammenfassungen). Du gibst KONKRETE, fachspezifische ' +
    'Empfehlungen. Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Fließtext ' +
    'drumherum, alles auf Deutsch.'

  const user = `Kurs: ${course.name || 'Unbekannt'}${
    course.semester ? ` (${course.semester})` : ''
  }.

Offene Aufgaben (JSON):
${JSON.stringify(tasks)}

Anstehende Klausuren (JSON):
${JSON.stringify(exams)}

Vorhandene Vorlesungsnotizen (Titel):
${JSON.stringify(lectureTitles)}

Aufgaben:
1. Bestimme die für DIESEN Kurs effizienteste Lernmethode (method) — knapp,
   z.B. "Programmieraufgaben selbst lösen" bei Programmierfächern oder
   "Active Recall + Altklausuren" bei Theoriefächern.
2. Begründe das in einem Satz (rationale).
3. Erstelle eine priorisierte Liste der nächsten Schritte (steps), wichtigste
   zuerst. Beziehe dich, wo sinnvoll, auf die offenen Aufgaben (gib dann deren
   id mit an); ergänze sonst eigene konkrete Schritte ohne id.

Antworte exakt in diesem JSON-Format:
{
  "method": "<kurze Methode, deutsch>",
  "rationale": "<ein Satz, deutsch>",
  "steps": [
    { "id": "<optional: id aus den Aufgaben>", "title": "<kurzer Schritt>", "reason": "<max 8 Wörter, deutsch>" }
  ]
}
Verwende ids nur, wenn sie in den offenen Aufgaben vorkommen. Maximal 6 Schritte.`

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 800,
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
    let plan
    try {
      plan = JSON.parse(content)
    } catch {
      return res.status(502).json({ error: 'KI-Antwort war kein gültiges JSON.' })
    }

    // Defensiv säubern: nur echte ids, Längen begrenzen, max 6 Schritte.
    const validIds = new Set(tasks.map((t) => t.id))
    const steps = (Array.isArray(plan.steps) ? plan.steps : [])
      .filter((s) => s && (s.title || s.id))
      .slice(0, 6)
      .map((s) => ({
        id: s.id && validIds.has(s.id) ? s.id : undefined,
        title: String(s.title || '').slice(0, 100),
        reason: String(s.reason || '').slice(0, 60),
      }))

    return res.status(200).json({
      method: typeof plan.method === 'string' ? plan.method.slice(0, 80) : '',
      rationale: typeof plan.rationale === 'string' ? plan.rationale.slice(0, 200) : '',
      steps,
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unbekannter Fehler' })
  }
}

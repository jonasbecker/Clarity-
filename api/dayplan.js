// Vercel Serverless Function: /api/dayplan
//
// KI-Tagesauswahl im „Deep Work"-Stil: Aus den offenen Aufgaben wählt die KI
// genau die aus, die heute in das verfügbare Zeitbudget passen — gebündelt nach
// Fach (lieber ein Fach intensiv als bunt gemischt), die Kurse strikt von oben
// nach unten. Läuft auf dem SERVER, damit der geheime GROQ_API_KEY hier liegen
// darf (ohne VITE_-Präfix). Antwort streng JSON.

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
  const tasks = Array.isArray(body?.tasks) ? body.tasks : []
  const courses = Array.isArray(body?.courses) ? body.courses : []
  const availableMinutes = Math.max(0, Math.round(Number(body?.availableMinutes) || 0))

  if (tasks.length === 0 || availableMinutes <= 0) {
    return res.status(200).json({ selected: [], summary: 'Nichts einzuplanen.' })
  }

  const system =
    'Du bist ein erfahrener, ruhiger Lerncoach. Du planst einen fokussierten ' +
    'Lerntag nach dem Deep-Work-Prinzip: lieber ein Fach am Stück als bunt ' +
    'gemischt. Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Fließtext.'

  const user = `Verfügbare Lernzeit heute: ${availableMinutes} Minuten (HARTES Limit).

Kurse in Prioritätsreihenfolge (oben = zuerst):
${JSON.stringify(courses)}

Offene Aufgaben (JSON, "duration_min" = geschätzte Dauer in Minuten):
${JSON.stringify(tasks)}

Aufgaben:
1. Wähle Aufgaben so aus, dass die Summe ihrer "duration_min" das Limit von
   ${availableMinutes} Minuten NICHT überschreitet.
2. Bündle nach Fach (course_id): nimm pro Kurs zusammenhängende Aufgaben, gehe
   die Kurse strikt von oben nach unten durch (Deep Work statt Mischen).
3. Bevorzuge Aufgaben mit naher Deadline ("due"), aber bleibe beim Bündeln.

Antworte exakt in diesem JSON-Format:
{
  "selected": [
    { "id": "<id aus der Eingabe>", "reason": "<kurzer Grund, max 6 Wörter, deutsch>" }
  ],
  "summary": "<ein motivierender Satz zum heutigen Fokus, deutsch>"
}
Verwende nur ids, die in den offenen Aufgaben vorkommen.`

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
        max_tokens: 900,
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

    // Defensiv säubern: nur echte ids, keine Doppelten, und das harte
    // Minuten-Limit notfalls vom Ende her durchsetzen.
    const durById = new Map(tasks.map((t) => [t.id, Number(t.duration_min) || 0]))
    const seen = new Set()
    let used = 0
    const selected = []
    for (const s of Array.isArray(plan.selected) ? plan.selected : []) {
      if (!s || !durById.has(s.id) || seen.has(s.id)) continue
      const dur = durById.get(s.id)
      if (used + dur > availableMinutes) continue
      seen.add(s.id)
      used += dur
      selected.push({ id: s.id, reason: String(s.reason || '').slice(0, 60) })
    }

    return res.status(200).json({
      selected,
      summary: typeof plan.summary === 'string' ? plan.summary : '',
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unbekannter Fehler' })
  }
}

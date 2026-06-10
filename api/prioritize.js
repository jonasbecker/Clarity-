// Vercel Serverless Function: /api/prioritize
//
// Läuft auf dem SERVER (nicht im Browser) — deshalb darf hier der geheime
// Groq-API-Key liegen. Die App schickt ihre Tasks + heutige Termine her,
// wir fragen die KI nach einer Priorisierung und geben sie zurück.
//
// Groq bietet eine zu OpenAI kompatible Schnittstelle. Der Key kommt aus
// der Umgebungsvariable GROQ_API_KEY (in Vercel hinterlegt, ohne VITE_-
// Präfix, damit er NICHT im Frontend landet).

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

  // Body robust einlesen (Vercel parst JSON meist schon).
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  const tasks = Array.isArray(body?.tasks) ? body.tasks : []
  const events = Array.isArray(body?.events) ? body.events : []

  if (tasks.length === 0) {
    return res.status(200).json({ focus: [], summary: 'Keine offenen Tasks.' })
  }

  const today = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const system =
    'Du bist ein knapper, freundlicher Planungs-Assistent (wie Motion). Du ' +
    'priorisierst Aufgaben und planst einen realistischen Tag. Antworte ' +
    'AUSSCHLIESSLICH mit gültigem JSON, ohne Fließtext drumherum.'

  const user = `Heute ist ${today}.

Offene Tasks (JSON, "duration_min" = bisher geschätzte Dauer in Minuten):
${JSON.stringify(tasks)}

Heutige Termine (JSON):
${JSON.stringify(events)}

Aufgaben:
1. Wähle die 1-3 wichtigsten Tasks für heute (focus). Berücksichtige
   Fälligkeit ("Heute"/"Überfällig" zuerst), Bereich und Beschreibung.
2. Erstelle einen geordneten Tagesplan (schedule) ALLER Tasks, die heute
   sinnvoll machbar sind — wichtigste/dringendste zuerst. Schätze für jede
   eine realistische Dauer in Minuten (duration_min, Vielfache von 5,
   typisch 15-120). Bei viel Termin-Last weniger einplanen.

Antworte exakt in diesem JSON-Format:
{
  "focus": [
    { "id": "<id aus der Eingabe>", "reason": "<kurzer Grund, max 8 Wörter, deutsch>" }
  ],
  "schedule": [
    { "id": "<id aus der Eingabe>", "duration_min": <ganzzahl>, "reason": "<kurzer Grund, max 6 Wörter, deutsch>" }
  ],
  "summary": "<ein motivierender Satz Tagesüberblick, deutsch>"
}
Verwende nur ids, die in den offenen Tasks vorkommen. Wichtigste zuerst.`

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

    // Defensiv säubern: nur echte ids, max 3.
    const validIds = new Set(tasks.map((t) => t.id))
    const focus = (Array.isArray(plan.focus) ? plan.focus : [])
      .filter((f) => f && validIds.has(f.id))
      .slice(0, 3)
      .map((f) => ({ id: f.id, reason: String(f.reason || '').slice(0, 80) }))

    // Tagesplan säubern: echte ids, keine Doppelten, Dauer in Grenzen.
    const seen = new Set()
    const schedule = (Array.isArray(plan.schedule) ? plan.schedule : [])
      .filter((s) => s && validIds.has(s.id) && !seen.has(s.id) && seen.add(s.id))
      .map((s) => {
        const d = Math.round(Number(s.duration_min))
        return {
          id: s.id,
          duration_min: Number.isFinite(d) ? Math.min(480, Math.max(5, d)) : 30,
          reason: String(s.reason || '').slice(0, 60),
        }
      })

    return res.status(200).json({
      focus,
      schedule,
      summary: typeof plan.summary === 'string' ? plan.summary : '',
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unbekannter Fehler' })
  }
}

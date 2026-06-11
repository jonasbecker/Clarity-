// Vercel Serverless Function: /api/planweek
//
// Läuft auf dem SERVER (geheimer Groq-Key). Die App schickt ihre offenen
// Tasks und die nächsten Tage (mit freier Kapazität); die KI verteilt die
// Tasks proaktiv auf die Tage — „was passt wann am besten". Das *Wann genau*
// (Uhrzeit) rechnet danach weiterhin der deterministische Scheduler.

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
  const days = Array.isArray(body?.days) ? body.days : []
  const dayCount = days.length || 5

  if (tasks.length === 0) {
    return res.status(200).json({ assignments: [], summary: 'Keine offenen Tasks.' })
  }

  const system =
    'Du bist ein knapper, freundlicher Wochenplaner (wie Motion). Du ' +
    'verteilst Aufgaben sinnvoll auf die kommenden Tage. Antworte ' +
    'AUSSCHLIESSLICH mit gültigem JSON, ohne Fließtext drumherum.'

  const user = `Plane die kommende Woche. Tag 0 ist heute.

Tage (JSON, "frei_min" = freie Minuten im Arbeitsfenster nach Abzug der Termine):
${JSON.stringify(days)}

Offene Tasks (JSON, "due" = Fälligkeit als Label, "duration_min" = geschätzte Dauer):
${JSON.stringify(tasks)}

Regeln:
1. Weise JEDER Task genau einen Tag zu (day = 0..${dayCount - 1}).
2. Überfällige und heute fällige Tasks gehören auf Tag 0.
3. Plane eine Task nie NACH ihrer Fälligkeit ein.
4. Verteile die Last gleichmäßig: überlade keinen Tag über seine "frei_min".
5. Gruppiere wenn möglich ähnliche Bereiche (area) am selben Tag.

Antworte exakt in diesem JSON-Format:
{
  "assignments": [
    { "id": "<id aus der Eingabe>", "day": <0..${dayCount - 1}>, "reason": "<kurzer Grund, max 6 Wörter, deutsch>" }
  ],
  "summary": "<ein motivierender Satz Wochenüberblick, deutsch>"
}
Verwende nur ids aus den offenen Tasks.`

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
        max_tokens: 1200,
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

    // Defensiv säubern: echte ids, keine Doppelten, day im gültigen Bereich.
    const validIds = new Set(tasks.map((t) => t.id))
    const seen = new Set()
    const assignments = (Array.isArray(plan.assignments) ? plan.assignments : [])
      .filter((a) => a && validIds.has(a.id) && !seen.has(a.id) && seen.add(a.id))
      .map((a) => {
        const d = Math.round(Number(a.day))
        return {
          id: a.id,
          day: Number.isFinite(d) ? Math.min(dayCount - 1, Math.max(0, d)) : 0,
          reason: String(a.reason || '').slice(0, 60),
        }
      })

    return res.status(200).json({
      assignments,
      summary: typeof plan.summary === 'string' ? plan.summary : '',
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unbekannter Fehler' })
  }
}

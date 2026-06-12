import { useState } from 'react'
import { fetchDayPlan } from './dayPlanApi.js'
import { dailyPick } from './dailyPick.js'

// Hook für die KI-Tagesauswahl mit deterministischem Fallback.
//
// `generate({ availableMinutes, courses, tasks })` versucht zuerst die KI
// (/api/dayplan). Klappt das nicht (lokal/Demo ohne Server, 404, Fehler),
// fällt es lautlos auf die deterministische `dailyPick`-Logik zurück — die
// Funktion ist also IMMER nutzbar. Das Ergebnis sind die ausgewählten ids
// (+ optionaler KI-Tagesüberblick), die der Aufrufer per `planManyForToday`
// auf „Heute" setzt.
export function useDayPlan() {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'ready'
  const [result, setResult] = useState(null) // { ids, summary, source }

  async function generate({ availableMinutes, courses, tasks }) {
    setStatus('loading')
    try {
      const data = await fetchDayPlan({ availableMinutes, courses, tasks })
      const valid = new Set(tasks.map((t) => t.id))
      const ids = (data.selected || []).map((s) => s.id).filter((id) => valid.has(id))
      // Leere KI-Antwort lieber durch die deterministische Auswahl ersetzen.
      if (ids.length === 0) throw new Error('leer')
      const res = { ids, summary: data.summary || '', source: 'ki' }
      setResult(res)
      setStatus('ready')
      return res
    } catch {
      const ids = dailyPick({ courses, tasks, availableMinutes })
      const res = { ids, summary: '', source: 'auto' }
      setResult(res)
      setStatus('ready')
      return res
    }
  }

  function reset() {
    setStatus('idle')
    setResult(null)
  }

  return { status, result, generate, reset }
}

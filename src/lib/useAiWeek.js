import { useCallback, useState } from 'react'
import { fetchAiWeek } from './aiWeek.js'

// Verwaltet die KI-Wochenplanung als Zustände:
//   'idle' | 'loading' | 'ready' | 'error'
// `generate({ tasks, days })` löst den Aufruf aus.
export function useAiWeek() {
  const [plan, setPlan] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const generate = useCallback(async ({ tasks, days }) => {
    setStatus('loading')
    setError(null)
    try {
      const result = await fetchAiWeek({ tasks, days })
      setPlan(result)
      setStatus('ready')
    } catch (e) {
      setError(e?.message || 'KI-Aufruf fehlgeschlagen')
      setStatus('error')
    }
  }, [])

  return { plan, status, error, generate }
}

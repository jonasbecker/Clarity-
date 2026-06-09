import { useCallback, useState } from 'react'
import { fetchAiPlan } from './aiPlan.js'

// Verwaltet den KI-Vorschlag als Zustände:
//   'idle' | 'loading' | 'ready' | 'error'
// `generate` löst den Aufruf aus (z. B. per Knopfdruck am Morgen).
export function useAiPlan() {
  const [plan, setPlan] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const generate = useCallback(async ({ tasks, events }) => {
    setStatus('loading')
    setError(null)
    try {
      const result = await fetchAiPlan({ tasks, events })
      setPlan(result)
      setStatus('ready')
    } catch (e) {
      setError(e?.message || 'KI-Aufruf fehlgeschlagen')
      setStatus('error')
    }
  }, [])

  return { plan, status, error, generate }
}

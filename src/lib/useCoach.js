import { useCallback, useState } from 'react'
import { fetchCoach } from './coach.js'

// Verwaltet die KI-Studiencoach-Empfehlung je Kurs als Zustände:
//   'idle' | 'loading' | 'ready' | 'error'
// `generate(course, tasks)` löst den Aufruf per Knopfdruck aus.
export function useCoach() {
  const [advice, setAdvice] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const generate = useCallback(async (course, tasks) => {
    setStatus('loading')
    setError(null)
    try {
      const result = await fetchCoach(course, tasks)
      setAdvice(result)
      setStatus('ready')
    } catch (e) {
      setError(e?.message || 'KI-Aufruf fehlgeschlagen')
      setStatus('error')
    }
  }, [])

  // Beim Kurswechsel zurücksetzen, damit keine fremde Empfehlung hängen bleibt.
  const reset = useCallback(() => {
    setAdvice(null)
    setStatus('idle')
    setError(null)
  }, [])

  return { advice, status, error, generate, reset }
}

import { useState } from 'react'
import { fetchTaskAnalysis } from './analyzeTaskApi.js'
import { analyzeTaskFallback } from './taskAnalysisFallback.js'

// Hook für die KI-Aufgaben-Analyse (Datei-Upload im TaskModal) mit
// deterministischem Fallback.
//
// `analyze({ title, courseName, text })` versucht zuerst die KI
// (/api/analyzeTask). Klappt das nicht (lokal/Demo ohne Server, 404, Fehler),
// fällt es lautlos auf die deterministische `analyzeTaskFallback`-Logik zurück
// — die Funktion ist also IMMER nutzbar.
export function useTaskAnalysis() {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'ready'
  const [result, setResult] = useState(null) // { duration_min, priority, kind, summary, source }

  async function analyze({ title, courseName, text }) {
    setStatus('loading')
    try {
      const data = await fetchTaskAnalysis({ title, courseName, text })
      if (data.duration_min == null && data.priority == null && data.kind == null) {
        throw new Error('leer')
      }
      const fallback = analyzeTaskFallback({ title, text })
      const res = {
        duration_min: data.duration_min ?? fallback.duration_min,
        priority: data.priority ?? fallback.priority,
        kind: data.kind ?? fallback.kind,
        summary: data.summary || fallback.summary,
        source: 'ki',
      }
      setResult(res)
      setStatus('ready')
      return res
    } catch {
      const res = { ...analyzeTaskFallback({ title, text }), source: 'auto' }
      setResult(res)
      setStatus('ready')
      return res
    }
  }

  function reset() {
    setStatus('idle')
    setResult(null)
  }

  return { status, result, analyze, reset }
}

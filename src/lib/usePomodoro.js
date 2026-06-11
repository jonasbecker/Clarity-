import { useEffect, useRef, useState } from 'react'

// Pomodoro-Timer als Hook. Wechselt zwischen Fokus- und Pausenphase und zählt
// in Sekunden herunter. `onPhaseEnd(neuePhase)` wird beim Phasenwechsel
// aufgerufen (z.B. für eine Benachrichtigung) — nicht beim ersten Rendern.
//
// Reine Timer-Logik, kein UI: die Lernumgebung rendert daraus mm:ss + Knöpfe.
export function usePomodoro({ work = 25, brk = 5, onPhaseEnd } = {}) {
  const [workMin, setWorkMin] = useState(work)
  const [breakMin, setBreakMin] = useState(brk)
  const [phase, setPhase] = useState('work') // 'work' | 'break'
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(work * 60)
  const firstPhase = useRef(true)

  // Herunterzählen, solange der Timer läuft. Bei 0 in die nächste Phase.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s > 1) return s - 1
        setPhase((p) => (p === 'work' ? 'break' : 'work'))
        return 0
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  // Beim Phasenwechsel die Sekunden auf die Länge der neuen Phase setzen und
  // (außer beim ersten Mal) den Callback feuern.
  useEffect(() => {
    setSeconds((phase === 'work' ? workMin : breakMin) * 60)
    if (firstPhase.current) {
      firstPhase.current = false
      return
    }
    onPhaseEnd?.(phase)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => setRunning(true)
  const pause = () => setRunning(false)
  function reset() {
    setRunning(false)
    firstPhase.current = true
    setPhase('work')
    setSeconds(workMin * 60)
  }
  // Zur nächsten Phase springen (z.B. Pause überspringen).
  function skip() {
    setPhase((p) => (p === 'work' ? 'break' : 'work'))
  }
  // Längen anpassen; läuft der Timer nicht, gleich die Anzeige aktualisieren.
  function setDurations(w, b) {
    setWorkMin(w)
    setBreakMin(b)
    if (!running) {
      firstPhase.current = true
      setPhase('work')
      setSeconds(w * 60)
    }
  }

  return { phase, running, seconds, workMin, breakMin, start, pause, reset, skip, setDurations }
}

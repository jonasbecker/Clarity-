import { useCallback, useEffect, useState } from 'react'
import {
  isGoogleConfigured,
  requestAccessToken,
  fetchTodaysEvents,
} from './googleCalendar.js'

// Verwaltet die Google-Kalender-Verbindung als überschaubare Zustände:
//   'unconfigured' – keine Client-ID hinterlegt (zeigt Beispiel-Timeline)
//   'idle'         – verbunden werden bereit (Knopf anzeigen)
//   'loading'      – Token holen / Termine laden
//   'connected'    – Termine geladen
//   'error'        – etwas ging schief
export function useGoogleCalendar() {
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState(
    isGoogleConfigured ? 'idle' : 'unconfigured',
  )
  const [error, setError] = useState(null)

  const load = useCallback(async (silent) => {
    setStatus('loading')
    setError(null)
    try {
      const token = await requestAccessToken({ silent })
      const evs = await fetchTodaysEvents(token)
      setEvents(evs)
      setStatus('connected')
    } catch (e) {
      // Stiller Versuch darf scheitern → einfach den Knopf zeigen.
      if (silent) {
        setStatus('idle')
        return
      }
      setStatus('error')
      setError(e?.message || 'Verbindung fehlgeschlagen')
    }
  }, [])

  // Beim Laden einmal leise versuchen — falls du schon zugestimmt hast,
  // erscheinen die Termine direkt ohne Klick.
  useEffect(() => {
    if (isGoogleConfigured) load(true)
  }, [load])

  return { events, status, error, connect: () => load(false) }
}

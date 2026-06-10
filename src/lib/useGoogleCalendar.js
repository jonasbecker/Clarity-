import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isGoogleConfigured,
  requestAccessToken,
  fetchEvents,
} from './googleCalendar.js'

// Wie oft die Termine im Hintergrund aktualisiert werden, solange die App
// offen und verbunden ist (damit neue Meetings im Plan auftauchen).
const REFRESH_MS = 5 * 60 * 1000

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
      const evs = await fetchEvents(token, 7) // heute + nächste Tage
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

  // Hintergrund-Aktualisierung: lädt die Termine still neu, OHNE den Status
  // auf 'loading' zu setzen (kein Flackern). Scheitert sie (z.B. Token
  // abgelaufen), behalten wir einfach die bisherigen Termine.
  const refresh = useCallback(async () => {
    try {
      const token = await requestAccessToken({ silent: true })
      const evs = await fetchEvents(token, 7)
      setEvents(evs)
      setStatus('connected')
    } catch {
      // still ignorieren — der Plan bleibt mit den alten Terminen bestehen.
    }
  }, [])

  // Beim Laden einmal leise versuchen — falls du schon zugestimmt hast,
  // erscheinen die Termine direkt ohne Klick.
  useEffect(() => {
    if (isGoogleConfigured) load(true)
  }, [load])

  // Solange verbunden: regelmäßig und beim Zurückkehren zur App still
  // nachladen, damit neue Termine automatisch im Tagesplan landen.
  // Ein Ref entkoppelt die Listener von Status-Änderungen.
  const connectedRef = useRef(false)
  useEffect(() => {
    connectedRef.current = status === 'connected'
  }, [status])

  useEffect(() => {
    if (!isGoogleConfigured) return

    const id = setInterval(() => {
      if (connectedRef.current) refresh()
    }, REFRESH_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible' && connectedRef.current) {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [refresh])

  return { events, status, error, connect: () => load(false), refresh }
}

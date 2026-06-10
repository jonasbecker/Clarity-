// Anbindung an die Google Calendar API — direkt aus dem Browser.
//
// Wir nutzen "Google Identity Services" (GIS): Google öffnet ein Popup, du
// bestätigst den Zugriff, und wir bekommen einen kurzlebigen "Access Token".
// Mit dem fragen wir die Kalender-API. Kein Backend nötig, nur Lesezugriff.
//
// Die Client-ID ist öffentlich (kein Geheimnis) — sie sagt Google nur,
// welche App fragt. Welche Konten/Kalender erlaubt sind, regelt Google.

import { toISODate } from './date.js'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

export const isGoogleConfigured = Boolean(CLIENT_ID)

// Das GIS-Script einmalig nachladen (nur wenn wirklich gebraucht).
let gisPromise
function loadGis() {
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Google-Script konnte nicht laden'))
    document.head.appendChild(s)
  })
  return gisPromise
}

// Einen Access Token holen.
// silent=true versucht es ohne Popup (klappt, wenn du schon zugestimmt hast).
export async function requestAccessToken({ silent = false } = {}) {
  await loadGis()
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      prompt: silent ? 'none' : '',
      callback: (resp) =>
        resp.error ? reject(resp) : resolve(resp.access_token),
      error_callback: (err) => reject(err),
    })
    client.requestAccessToken()
  })
}

// Datum → "09:00" (deutsche 24h-Schreibweise).
const fmtTime = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
})

// Verwandelt ein Google-Event in unsere schlanke Timeline-Form.
// `date` ('YYYY-MM-DD') sagt, an welchem Tag das Event liegt — wichtig für
// die Mehrtages-Planung (Termine dem richtigen Tag zuordnen).
function mapEvent(e) {
  const allDay = Boolean(e.start?.date) // ganztägige Events haben .date statt .dateTime
  const startAt = allDay ? null : new Date(e.start.dateTime)
  return {
    id: e.id,
    title: e.summary || '(ohne Titel)',
    allDay,
    date: allDay ? e.start.date : toISODate(startAt),
    start: allDay ? null : fmtTime.format(startAt),
    end: allDay || !e.end?.dateTime ? null : fmtTime.format(new Date(e.end.dateTime)),
  }
}

// Termine der nächsten `days` Tage (ab heute 00:00) aus dem Hauptkalender
// laden, zeitlich sortiert. Jedes Event trägt sein `date` für die Zuordnung
// zum richtigen Planungstag.
export async function fetchEvents(accessToken, days = 7) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setDate(end.getDate() + Math.max(1, days) - 1)
  end.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true', // Serientermine in Einzeltermine auflösen
    orderBy: 'startTime',
    maxResults: '100',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) throw new Error(`Kalender-API antwortete mit ${res.status}`)

  const data = await res.json()
  return (data.items || []).map(mapEvent)
}

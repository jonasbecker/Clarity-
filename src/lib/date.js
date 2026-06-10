// Kleine Hilfsfunktionen rund ums Datum. Hier gesammelt, damit
// Komponenten keine Datums-Logik enthalten (sauberer Schnitt).

// Liefert eine Begrüßung passend zur Tageszeit.
export function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 11) return 'Guten Morgen'
  if (hour < 18) return 'Hallo'
  return 'Guten Abend'
}

// Formatiert ein Datum als z.B. "Dienstag, 9. Juni" (deutsch).
export function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

// --- Fälligkeits-Datum (gespeichert als 'YYYY-MM-DD') ---

// Ein Date → 'YYYY-MM-DD' in lokaler Zeit (kein UTC-Versatz).
export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ISO-Datum, n Tage von heute aus (0 = heute, 1 = morgen …).
export function isoInDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

// ISO-Datum + n Tage (für wiederkehrende Tasks: nächste Fälligkeit).
export function addDaysToISO(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + n)
  return toISODate(date)
}

// Ganze Tage von heute bis zum Datum (negativ = Vergangenheit, null = keins).
export function daysUntil(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86_400_000)
}

// Freundliches Label für ein Fälligkeitsdatum.
export function formatDueLabel(iso) {
  if (!iso) return null
  const diff = daysUntil(iso)
  if (diff === 0) return 'Heute'
  if (diff === 1) return 'Morgen'
  if (diff === 2) return 'Übermorgen'
  if (diff === -1) return 'Gestern'
  if (diff < 0) return 'Überfällig'
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(y, m - 1, d))
}

// Liegt das Datum in der Vergangenheit (vor heute)?
export function isOverdue(iso) {
  const diff = daysUntil(iso)
  return diff != null && diff < 0
}

// Montag der Woche, in der `date` liegt (00:00 Uhr lokal).
export function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = So … 6 = Sa
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

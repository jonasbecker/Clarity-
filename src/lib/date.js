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

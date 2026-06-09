// Dummy-Daten für Phase 1.
//
// Diese Datei ist bewusst die EINZIGE Quelle für Beispiel-Daten. Die UI-
// Komponenten bekommen alles als Props und wissen nicht, woher die Daten
// kommen. In Phase 2 ersetzen wir den Inhalt hier durch echte API-Calls
// (Notion, Google Calendar) — die Komponenten bleiben unverändert.

// Die drei Lebensbereiche. Die `accent`-Werte zeigen auf die CSS-Variablen
// aus index.css, damit Farben an einer Stelle definiert sind.
export const areas = {
  study: { id: 'study', label: 'Studium', color: 'var(--color-area-study)' },
  work: { id: 'work', label: 'Arbeit', color: 'var(--color-area-work)' },
  private: { id: 'private', label: 'Privat', color: 'var(--color-area-private)' },
}

// Der Name für die Begrüßung.
export const user = {
  name: 'Jonas',
}

// Die 3 KI-vorgeschlagenen Top-Tasks für heute ("Dein Fokus heute").
export const focusTasks = [
  {
    id: 'f1',
    title: 'Statistik-Übungsblatt 4 abschließen',
    area: 'study',
    reason: 'Abgabe morgen um 12:00',
    estimate: '90 Min',
  },
  {
    id: 'f2',
    title: 'Präsentation für Team-Meeting vorbereiten',
    area: 'work',
    reason: 'Meeting heute um 14:00',
    estimate: '45 Min',
  },
  {
    id: 'f3',
    title: 'Geburtstagsgeschenk für Mama bestellen',
    area: 'private',
    reason: 'Noch 3 Tage bis zum Versand-Deadline',
    estimate: '15 Min',
  },
]

// Kalender-Termine für die Timeline. `start`/`end` sind 24h-Zeiten als
// String — bewusst simpel gehalten für Phase 1.
export const timeline = [
  { id: 't1', title: 'Deep Work: Statistik', start: '09:00', end: '10:30', area: 'study' },
  { id: 't2', title: 'Standup', start: '11:00', end: '11:15', area: 'work' },
  { id: 't3', title: 'Mittagspause', start: '12:30', end: '13:15', area: 'private' },
  { id: 't4', title: 'Team-Meeting', start: '14:00', end: '15:00', area: 'work' },
  { id: 't5', title: 'Sport', start: '18:00', end: '19:00', area: 'private' },
]

// Alle offenen Tasks. In der UI gruppieren wir sie nach `area`.
export const openTasks = [
  { id: 'o1', title: 'Literatur für Seminararbeit recherchieren', area: 'study', due: 'Diese Woche' },
  { id: 'o2', title: 'Vorlesung Datenbanken nachbereiten', area: 'study', due: null },
  { id: 'o3', title: 'Klausuranmeldung prüfen', area: 'study', due: 'Bis Freitag' },
  { id: 'o4', title: 'Code-Review für PR #213', area: 'work', due: 'Heute' },
  { id: 'o5', title: 'Reisekostenabrechnung einreichen', area: 'work', due: null },
  { id: 'o6', title: 'Wäsche waschen', area: 'private', due: null },
  { id: 'o7', title: 'Zahnarzttermin vereinbaren', area: 'private', due: 'Diese Woche' },
]

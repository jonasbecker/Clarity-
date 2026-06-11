// Dummy-Daten für Phase 1.
//
// Diese Datei ist bewusst die EINZIGE Quelle für Beispiel-Daten. Die UI-
// Komponenten bekommen alles als Props und wissen nicht, woher die Daten
// kommen. In Phase 2 ersetzen wir den Inhalt hier durch echte API-Calls
// (Notion, Google Calendar) — die Komponenten bleiben unverändert.

import { isoInDays } from '../lib/date.js'

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

// Kurse/Module fürs Studium (Demo). `grade` ist die deutsche Note (1.0–5.0)
// oder null, solange der Kurs noch nicht benotet ist; `ects` die Leistungs-
// punkte. Tasks im Bereich Studium können auf eine dieser ids zeigen.
// `links` sind wichtige Kurs-Links (Moodle/Skript), `lectures` die
// Vorlesungsnotizen (Akkordeon), `archived` markiert abgeschlossene Semester.
export const courses = [
  {
    id: 'c1',
    name: 'Statistik II',
    color: 'var(--color-area-study)',
    semester: 'WS25/26',
    ects: 6,
    grade: 2.3,
    archived: false,
    links: [
      { label: 'Moodle-Kursraum', url: 'https://moodle.example.org/statistik2' },
      { label: 'Skript (PDF)', url: 'https://example.org/statistik2-skript.pdf' },
    ],
    lectures: [
      { id: 'l1a', title: 'Vorlesung 1 – Wahrscheinlichkeit', body: 'Grundbegriffe: Ereignis, Wahrscheinlichkeit, Laplace. Wichtig: Additionssatz und bedingte Wahrscheinlichkeit.' },
      { id: 'l1b', title: 'Vorlesung 2 – Verteilungen', body: 'Binomial- und Normalverteilung. Erwartungswert und Varianz.' },
    ],
  },
  {
    id: 'c2',
    name: 'Datenbanken',
    color: '#0ea5e9',
    semester: 'WS25/26',
    ects: 5,
    grade: null,
    archived: false,
    links: [{ label: 'Übungsblätter', url: 'https://example.org/db-uebungen' }],
    lectures: [],
  },
  {
    id: 'c3',
    name: 'Mikroökonomie',
    color: '#f59e0b',
    semester: 'SS25',
    ects: 6,
    grade: 1.7,
    archived: true,
    links: [],
    lectures: [],
  },
]

// Hausarbeiten-Manager: Beispiel-Recherchequellen.
export const papers = [
  { id: 'p1', title: 'Bayessche Statistik in der Praxis', author: 'Müller, TU München', course_id: 'c1', url: 'https://example.org/bayes', status: 'to_read' },
  { id: 'p2', title: 'Normalisierung relationaler Datenbanken', author: 'Codd', course_id: 'c2', url: 'https://example.org/normalisierung', status: 'read' },
]

// Allgemeine To-Dos: studiumsfremde Checkliste.
export const chores = [
  { id: 'ch1', title: 'Mensakarte aufladen', done: false },
  { id: 'ch2', title: 'Semesterticket verlängern', done: false },
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
// `due_date` ist ein echtes Datum ('YYYY-MM-DD') oder null; isoInDays setzt
// die Beispiele relativ zu heute, damit die Demo immer aktuell aussieht.
export const openTasks = [
  { id: 'o1', title: 'Literatur für Seminararbeit recherchieren', area: 'study', course_id: 'c1', status: 'doing', due_date: isoInDays(4), description: null, duration_min: 60, priority: 'medium', tags: ['Seminararbeit'], subtasks: [
    { id: 's1a', title: 'Suchbegriffe festlegen', done: true },
    { id: 's1b', title: 'Datenbanken durchsuchen', done: false },
    { id: 's1c', title: 'Quellen in Zotero sammeln', done: false },
  ] },
  { id: 'o2', title: 'Vorlesung Datenbanken nachbereiten', area: 'study', course_id: 'c2', due_date: null, description: null, duration_min: 45, priority: 'low', tags: [], subtasks: [] },
  { id: 'o3', title: 'Klausuranmeldung prüfen', area: 'study', course_id: 'c2', due_date: isoInDays(2), description: 'Im Campus-Portal anmelden', duration_min: 15, priority: 'high', tags: ['dringend'], subtasks: [] },
  { id: 'o4', title: 'Code-Review für PR #213', area: 'work', due_date: isoInDays(0), description: null, duration_min: 45, priority: 'high', tags: ['dringend'], subtasks: [] },
  { id: 'o5', title: 'Reisekostenabrechnung einreichen', area: 'work', due_date: null, description: null, duration_min: 30, priority: 'medium', tags: [], subtasks: [] },
  { id: 'o6', title: 'Wäsche waschen', area: 'private', due_date: null, description: null, duration_min: 15, priority: 'low', tags: ['Haushalt'], subtasks: [] },
  { id: 'o7', title: 'Zahnarzttermin vereinbaren', area: 'private', due_date: isoInDays(3), description: null, duration_min: 15, priority: 'medium', tags: [], subtasks: [] },
  { id: 'o8', title: 'Klausur Statistik II', area: 'study', kind: 'exam', course_id: 'c1', due_date: isoInDays(9), description: null, duration_min: 120, priority: 'high', tags: [], subtasks: [
    { id: 's8a', title: 'Kapitel 1–3 wiederholen', done: true },
    { id: 's8b', title: 'Altklausuren rechnen', done: false },
    { id: 's8c', title: 'Formelsammlung erstellen', done: false },
  ] },
]

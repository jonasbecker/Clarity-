// Dummy-Daten für Phase 1.
//
// Diese Datei ist bewusst die EINZIGE Quelle für Beispiel-Daten. Die UI-
// Komponenten bekommen alles als Props und wissen nicht, woher die Daten
// kommen. In Phase 2 ersetzen wir den Inhalt hier durch echte API-Calls
// (Notion, Google Calendar) — die Komponenten bleiben unverändert.

import { isoInDays } from '../lib/date.js'

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
    target_date: null, // hat eine Klausur (o8) — Pace zieht daraus das Datum
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
    target_date: isoInDays(14), // kein Klausur-Task → manuelles Lernziel
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
    target_date: null,
    links: [],
    lectures: [],
  },
]

// Kalender-Termine für die Timeline. `start`/`end` sind 24h-Zeiten als
// String — bewusst simpel gehalten.
export const timeline = [
  { id: 't1', title: 'Vorlesung Statistik II', start: '09:00', end: '10:30' },
  { id: 't2', title: 'Übung Datenbanken', start: '11:00', end: '12:00' },
  { id: 't3', title: 'Mittagspause', start: '12:30', end: '13:15' },
]

// Alle offenen Lernaufgaben (reiner Studienplaner). `due_date` ist eine harte
// Deadline (Klausur/Zieltermin) oder null; `planned_date` markiert, ob die
// Aufgabe heute auf „Heute" gezogen ist. isoInDays setzt die Beispiele relativ
// zu heute, damit die Demo immer aktuell aussieht.
export const openTasks = [
  { id: 'o1', title: 'Literatur für Seminararbeit recherchieren', area: 'study', course_id: 'c1', status: 'doing', due_date: isoInDays(4), planned_date: isoInDays(0), description: null, duration_min: 60, priority: 'medium', tags: ['Seminararbeit'], subtasks: [
    { id: 's1a', title: 'Suchbegriffe festlegen', done: true },
    { id: 's1b', title: 'Datenbanken durchsuchen', done: false },
    { id: 's1c', title: 'Quellen in Zotero sammeln', done: false },
  ] },
  { id: 'o2', title: 'Vorlesung Datenbanken nachbereiten', area: 'study', course_id: 'c2', due_date: null, planned_date: null, description: null, duration_min: 45, priority: 'low', tags: [], subtasks: [] },
  { id: 'o3', title: 'Übungsblatt 3 rechnen', area: 'study', course_id: 'c2', due_date: isoInDays(2), planned_date: isoInDays(0), description: 'Aufgaben 1–4', duration_min: 45, priority: 'high', tags: ['dringend'], subtasks: [] },
  { id: 'o4', title: 'Altklausuren Statistik durchgehen', area: 'study', course_id: 'c1', due_date: null, planned_date: null, description: null, duration_min: 90, priority: 'medium', tags: [], subtasks: [] },
  { id: 'o5', title: 'Karteikarten Verteilungen erstellen', area: 'study', course_id: 'c1', due_date: null, planned_date: null, description: null, duration_min: 30, priority: 'low', tags: [], subtasks: [] },
  { id: 'o8', title: 'Klausur Statistik II', area: 'study', kind: 'exam', course_id: 'c1', due_date: isoInDays(9), planned_date: null, description: null, duration_min: 120, priority: 'high', tags: [], subtasks: [
    { id: 's8a', title: 'Kapitel 1–3 wiederholen', done: true },
    { id: 's8b', title: 'Altklausuren rechnen', done: false },
    { id: 's8c', title: 'Formelsammlung erstellen', done: false },
  ] },
]

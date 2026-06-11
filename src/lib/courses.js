import { supabase } from './supabase.js'

// Datenzugriffs-Schicht für Kurse/Module (Studium).
// Gleiches Muster wie tasks.js/templates.js: nur hier sprechen wir mit der
// Datenbank. Die UI greift über den useCourses-Hook zu und weiß nichts davon.
//
// Spalten der Tabelle "courses":
//   id, user_id, name, color, semester, ects, grade, links, lectures,
//   archived, inserted_at

const TABLE = 'courses'
const COLS = 'id, name, color, semester, ects, grade, links, lectures, archived'

// Alle Kurse des eingeloggten Nutzers, älteste zuerst (stabile Reihenfolge).
export async function fetchCourses() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .order('inserted_at', { ascending: true })
  if (error) throw error
  return data
}

// Neuen Kurs anlegen und die fertige Zeile (mit id) zurückgeben.
export async function createCourse(fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(fields)
    .select(COLS)
    .single()
  if (error) throw error
  return data
}

// Kurs ändern (z.B. Note oder ECTS nachtragen).
export async function updateCourse(id, changes) {
  const { error } = await supabase.from(TABLE).update(changes).eq('id', id)
  if (error) throw error
}

// Kurs löschen. Die DB setzt course_id betroffener Tasks automatisch auf null
// (on delete set null) — die Tasks bleiben also erhalten.
export async function deleteCourse(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

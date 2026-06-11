import { supabase } from './supabase.js'

// Datenzugriffs-Schicht für den Hausarbeiten-Manager (Recherche-Quellen).
// Gleiches Muster wie courses.js/tasks.js: nur hier sprechen wir mit der
// Datenbank. Die UI greift über den usePapers-Hook zu.
//
// Spalten der Tabelle "papers":
//   id, user_id, title, author, course_id, url, status, inserted_at

const TABLE = 'papers'
const COLS = 'id, title, author, course_id, url, status'

// Alle Quellen des eingeloggten Nutzers, älteste zuerst (stabile Reihenfolge).
export async function fetchPapers() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .order('inserted_at', { ascending: true })
  if (error) throw error
  return data
}

// Neue Quelle anlegen und die fertige Zeile (mit id) zurückgeben.
export async function createPaper(fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(fields)
    .select(COLS)
    .single()
  if (error) throw error
  return data
}

// Quelle ändern (z.B. Status auf "gelesen" setzen).
export async function updatePaper(id, changes) {
  const { error } = await supabase.from(TABLE).update(changes).eq('id', id)
  if (error) throw error
}

// Quelle löschen.
export async function deletePaper(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

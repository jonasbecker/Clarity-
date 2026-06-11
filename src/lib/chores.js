import { supabase } from './supabase.js'

// Datenzugriffs-Schicht für die allgemeinen To-Dos (studiumsfremde Checkliste).
// Gleiches Muster wie courses.js: nur hier sprechen wir mit der Datenbank.
//
// Spalten der Tabelle "chores":
//   id, user_id, title, done, inserted_at

const TABLE = 'chores'
const COLS = 'id, title, done'

// Alle To-Dos des eingeloggten Nutzers, älteste zuerst (stabile Reihenfolge).
export async function fetchChores() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .order('inserted_at', { ascending: true })
  if (error) throw error
  return data
}

// Neues To-Do anlegen und die fertige Zeile (mit id) zurückgeben.
export async function createChore(fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(fields)
    .select(COLS)
    .single()
  if (error) throw error
  return data
}

// To-Do ändern (z.B. abhaken).
export async function updateChore(id, changes) {
  const { error } = await supabase.from(TABLE).update(changes).eq('id', id)
  if (error) throw error
}

// To-Do löschen.
export async function deleteChore(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

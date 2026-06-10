import { supabase } from './supabase.js'

// Datenzugriffs-Schicht für Vorlagen (Routine-Tasks als Blaupause).
// Gleiches Muster wie tasks.js: nur hier sprechen wir mit der Datenbank.
//
// Spalten der Tabelle "task_templates":
//   id, user_id, title, area, duration_min, description, repeat, inserted_at

const TABLE = 'task_templates'
const COLS = 'id, title, area, duration_min, description, repeat'

// Alle Vorlagen des eingeloggten Nutzers, älteste zuerst (stabile Reihenfolge).
export async function fetchTemplates() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .order('inserted_at', { ascending: true })
  if (error) throw error
  return data
}

// Neue Vorlage anlegen und die fertige Zeile (mit id) zurückgeben.
export async function createTemplate(fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(fields)
    .select(COLS)
    .single()
  if (error) throw error
  return data
}

// Vorlage löschen.
export async function deleteTemplate(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

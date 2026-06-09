import { supabase } from './supabase.js'

// Datenzugriffs-Schicht für Tasks.
//
// Hier — und NUR hier — sprechen wir mit der Datenbank. Die UI-Komponenten
// rufen diese Funktionen (über den useTasks-Hook) auf und wissen nichts
// von Supabase. Genau der "saubere Schnitt" wie schon bei den Dummy-Daten:
// die Datenquelle ist austauschbar, die UI bleibt gleich.
//
// Die Tabelle heißt "tasks" und hat die Spalten:
//   id, user_id, title, area, due_date, description, done, inserted_at
// (siehe supabase/schema.sql). user_id wird von der DB automatisch auf den
// eingeloggten Nutzer gesetzt — wir müssen ihn nie selbst mitschicken.

const TABLE = 'tasks'
const COLS = 'id, title, area, due_date, description, done'

// Alle Tasks des eingeloggten Nutzers, neueste zuerst.
export async function fetchTasks() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .order('inserted_at', { ascending: false })
  if (error) throw error
  return data
}

// Neue Task anlegen und die fertige Zeile (mit id) zurückgeben.
export async function createTask(fields) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...fields, done: false })
    .select(COLS)
    .single()
  if (error) throw error
  return data
}

// Erledigt-Status umschalten (oder andere Felder ändern).
export async function updateTask(id, changes) {
  const { error } = await supabase.from(TABLE).update(changes).eq('id', id)
  if (error) throw error
}

// Task löschen.
export async function deleteTask(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

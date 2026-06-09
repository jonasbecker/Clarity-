import { createClient } from '@supabase/supabase-js'

// Liest die Verbindungsdaten aus den Umgebungsvariablen.
// Vite macht nur Variablen mit dem Präfix VITE_ im Frontend sichtbar.
// Diese zwei Werte sind ÖFFENTLICH gedacht — der "anon key" ist kein
// Geheimnis. Sicher wird das durch "Row Level Security" in der Datenbank
// (siehe supabase/schema.sql): jeder sieht nur seine eigenen Zeilen.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Solange keine Schlüssel hinterlegt sind, läuft die App im Demo-Modus
// (lokal, ohne Speichern). So ist sie nie kaputt, auch vor dem Setup.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null

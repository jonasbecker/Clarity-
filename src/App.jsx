import AppShell from './views/AppShell.jsx'
import Login from './views/Login.jsx'
import { useAuth } from './lib/useAuth.js'
import { isSupabaseConfigured } from './lib/supabase.js'

// Die App-Wurzel entscheidet, was angezeigt wird:
// - Ohne Supabase-Schlüssel: Demo-Modus (Tasks lokal, ohne Speichern).
// - Mit Schlüsseln, aber nicht eingeloggt: Login-Bildschirm.
// - Eingeloggt: die App-Shell (Studium-Hub als Start, „Heute" als Bereich).
export default function App() {
  const { session, loading } = useAuth()

  if (isSupabaseConfigured && loading) {
    return (
      <div className="grid min-h-screen place-items-center text-ink-soft">
        Lädt …
      </div>
    )
  }

  if (isSupabaseConfigured && !session) {
    return <Login />
  }

  return <AppShell session={session} />
}

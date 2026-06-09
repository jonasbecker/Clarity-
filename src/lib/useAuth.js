import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase.js'

// Verfolgt den Login-Status. `session` ist null, wenn niemand eingeloggt
// ist, sonst enthält sie den Nutzer. Supabase merkt sich den Login im
// Browser, also bleibt man nach dem Neuladen angemeldet.
export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    // Aktuellen Login einmalig abfragen …
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // … und auf Änderungen hören (Login / Logout).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, loading }
}

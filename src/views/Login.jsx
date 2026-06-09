import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Login-/Registrieren-Bildschirm.
// Bewusst simpel: E-Mail + Passwort. Über `mode` schalten wir zwischen
// Anmelden und Konto-Erstellen um — beides nutzt denselben Code, nur eine
// andere Supabase-Funktion.
export default function Login() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)

    const fn =
      mode === 'signin'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password })
    const { error } = await fn

    if (error) setError(error.message)
    else if (mode === 'signup')
      setMessage('Konto erstellt! Du kannst dich jetzt anmelden.')
    setBusy(false)
  }

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm">
        {/* Markenzeichen passend zum App-Icon */}
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink">
            <span className="block size-4 rounded-full bg-area-study" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Clarity</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {mode === 'signin'
              ? 'Melde dich an, um deine Tasks zu sehen.'
              : 'Erstelle ein Konto, um loszulegen.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-line bg-surface p-6 shadow-sm"
        >
          <label className="mb-1 block text-sm font-medium text-ink-soft">
            E-Mail
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mb-4 w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-ink/30"
          />

          <label className="mb-1 block text-sm font-medium text-ink-soft">
            Passwort
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === 'signin' ? 'current-password' : 'new-password'
            }
            className="mb-4 w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-ink/30"
          />

          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          {message && <p className="mb-3 text-sm text-area-private">{message}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-ink py-3.5 font-medium text-canvas transition-opacity disabled:opacity-50"
          >
            {busy
              ? 'Moment …'
              : mode === 'signin'
                ? 'Anmelden'
                : 'Konto erstellen'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-soft">
          {mode === 'signin' ? 'Noch kein Konto?' : 'Schon ein Konto?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setMessage(null)
            }}
            className="font-medium text-ink underline-offset-2 hover:underline"
          >
            {mode === 'signin' ? 'Registrieren' : 'Anmelden'}
          </button>
        </p>
      </div>
    </main>
  )
}

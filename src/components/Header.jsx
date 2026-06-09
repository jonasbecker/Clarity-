import { LogOut } from 'lucide-react'
import { getGreeting, formatLongDate } from '../lib/date.js'

// Header: persönliche Begrüßung + heutiges Datum.
// `onSignOut` ist optional — nur wenn jemand eingeloggt ist, zeigen wir
// den Abmelden-Knopf.
export default function Header({ name, onSignOut }) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">
          {formatLongDate()}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          {getGreeting()}, {name}
        </h1>
      </div>

      {onSignOut && (
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Abmelden"
          className="mt-1 grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
        >
          <LogOut size={18} />
        </button>
      )}
    </header>
  )
}

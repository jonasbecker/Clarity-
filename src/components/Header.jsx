import { BarChart3, GraduationCap, LogOut, Moon, Sun } from 'lucide-react'
import { getGreeting, formatLongDate } from '../lib/date.js'
import ProgressRing from './ProgressRing.jsx'

// Header: Begrüßung + Datum links, Aktionen rechts.
// `theme`/`onToggleTheme` schalten Hell/Dunkel; `onSignOut` (optional)
// zeigt den Abmelden-Knopf nur, wenn jemand eingeloggt ist.
// `onOpenStudy`/`onOpenStats` (optional) öffnen Studium- bzw. Statistik-Ansicht.
// `progress` (optional) zeigt den Tagesfortschritt als kleinen Ring.
// `weekly` (optional, { total, streak }) blendet die schlanke Wochenbilanz
// gleich hier ein — eine eigene Karte dafür entfällt.
export default function Header({ name, theme, onToggleTheme, onSignOut, onOpenStudy, onOpenStats, progress, weekly }) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">
          {formatLongDate()}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          {getGreeting()}, {name}
        </h1>
        {progress && (
          <div className="mt-3 flex items-center gap-3">
            <ProgressRing done={progress.done} total={progress.total} size={40} stroke={4} />
            <div className="text-sm text-ink-soft">
              <p>
                {progress.total === 0
                  ? 'Keine Tasks für heute geplant'
                  : `${progress.done} von ${progress.total} heute erledigt`}
              </p>
              {weekly?.total > 0 && (
                <p className="mt-0.5 text-xs">
                  Diese Woche {weekly.total} erledigt
                  {weekly.streak > 1 && <> · 🔥 {weekly.streak} Tage in Folge</>}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-1 flex shrink-0 items-center gap-1">
        {onOpenStudy && (
          <button
            type="button"
            onClick={onOpenStudy}
            aria-label="Studium öffnen"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
          >
            <GraduationCap size={18} />
          </button>
        )}

        {onOpenStats && (
          <button
            type="button"
            onClick={onOpenStats}
            aria-label="Statistik öffnen"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
          >
            <BarChart3 size={18} />
          </button>
        )}

        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Heller Modus' : 'Dunkler Modus'}
            className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Abmelden"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  )
}

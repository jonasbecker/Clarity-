import { useEffect } from 'react'
import { X, Moon, Sun, CalendarCheck, CalendarPlus, Loader2 } from 'lucide-react'
import WorkHoursEditor from '../components/WorkHoursEditor.jsx'

// Vollbild-Einstellungen: Darstellung (Hell/Dunkel), Arbeitszeiten und
// Kalender-Verbindung. Folgt dem Overlay-Muster aus StatsView (Escape
// schließt, Hintergrund gesperrt).
export default function SettingsView({ theme, onToggleTheme, planPrefs, calendar, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Einstellungen</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Einstellungen schließen"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
          >
            <X size={20} />
          </button>
        </div>

        <section className="mb-8">
          <h3 className="mb-3 text-sm font-semibold text-ink-soft">Darstellung</h3>
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex w-full items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-left text-sm"
          >
            {theme === 'dark' ? (
              <Moon size={16} className="shrink-0 text-ink-soft" />
            ) : (
              <Sun size={16} className="shrink-0 text-ink-soft" />
            )}
            <span className="font-medium">
              {theme === 'dark' ? 'Dunkler Modus' : 'Heller Modus'}
            </span>
            <span className="ml-auto text-xs text-ink-soft">Umschalten</span>
          </button>
        </section>

        <section className="mb-8">
          <h3 className="mb-3 text-sm font-semibold text-ink-soft">Arbeitszeiten</h3>
          <WorkHoursEditor prefs={planPrefs} />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-ink-soft">Kalender</h3>
          <CalendarSetting calendar={calendar} />
        </section>
      </div>
    </div>
  )
}

// Verbindungsstatus zum Google Kalender. Ohne Verbindung läuft „Heute" mit
// einem Demo-Kalender (siehe DayPlan); hier kannst du den echten verbinden.
function CalendarSetting({ calendar }) {
  if (!calendar) return null
  const { status, error, connect } = calendar

  if (status === 'connected') {
    return (
      <div className="flex w-full items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
        <CalendarCheck size={16} className="shrink-0 text-area-study" />
        <span className="font-medium">Google Kalender verbunden</span>
      </div>
    )
  }

  if (status === 'unconfigured') {
    return (
      <div className="flex w-full items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
        <CalendarPlus size={16} className="shrink-0" />
        Kalender-Verbindung ist nicht eingerichtet.
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={connect}
        disabled={status === 'loading'}
        className="flex w-full items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-left text-sm disabled:opacity-50"
      >
        {status === 'loading' ? (
          <Loader2 size={16} className="shrink-0 animate-spin text-ink-soft" />
        ) : (
          <CalendarPlus size={16} className="shrink-0 text-ink-soft" />
        )}
        <span className="font-medium">Google Kalender verbinden</span>
        <span className="ml-auto text-xs text-ink-soft">
          {status === 'loading' ? 'Verbinde …' : 'Verbinden'}
        </span>
      </button>
      {status === 'error' && (
        <p className="mt-2 text-sm text-danger">{error || 'Verbindung fehlgeschlagen'}</p>
      )}
    </div>
  )
}

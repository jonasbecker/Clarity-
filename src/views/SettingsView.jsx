import { useEffect } from 'react'
import { X, Moon, Sun } from 'lucide-react'
import WorkHoursEditor from '../components/WorkHoursEditor.jsx'

// Vollbild-Einstellungen: Darstellung (Hell/Dunkel) und Arbeitszeiten.
// Folgt dem Overlay-Muster aus StatsView (Escape schließt, Hintergrund
// gesperrt).
export default function SettingsView({ theme, onToggleTheme, planPrefs, onClose }) {
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

        <section>
          <h3 className="mb-3 text-sm font-semibold text-ink-soft">Arbeitszeiten</h3>
          <WorkHoursEditor prefs={planPrefs} />
        </section>
      </div>
    </div>
  )
}

import { BarChart3, LogOut, Moon, Sun } from 'lucide-react'

// Obere Navigationsleiste der App-Shell. Links die Marke, daneben die
// Bereiche (Studium-Hub, Heute, …), rechts globale Aktionen (Statistik,
// Hell/Dunkel, Abmelden). Die Bereiche kommen als `items` herein, damit
// spätere Phasen einfach weitere Einträge ergänzen können.
//
// `view` ist der aktive Bereich, `onNavigate(id)` wechselt ihn.
export default function NavBar({
  items,
  view,
  onNavigate,
  theme,
  onToggleTheme,
  onOpenStats,
  onSignOut,
}) {
  return (
    <nav className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-5 py-2 sm:px-8">
        <span className="mr-1 hidden text-sm font-semibold tracking-tight sm:block">
          Clarity
        </span>

        {/* Bereiche — horizontal scrollbar auf schmalen Displays */}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {items.map((it) => {
            const active = view === it.id
            const Icon = it.icon
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onNavigate(it.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-ink text-canvas'
                    : 'text-ink-soft hover:bg-surface'
                }`}
              >
                <Icon size={16} />
                {it.label}
              </button>
            )
          })}
        </div>

        {/* Globale Aktionen */}
        <div className="flex shrink-0 items-center gap-1">
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
      </div>
    </nav>
  )
}

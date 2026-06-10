import { ChevronDown } from 'lucide-react'

// Kleine, wiederverwendbare Überschrift für die Bereiche der Seite.
// Optional rechts ein `aside` (z.B. eine Anzahl).
// Mit `collapsible` wird die Überschrift zum Button, der den Abschnitt
// ein-/ausklappt (gleiches Muster wie bei "Erledigt").
export default function SectionTitle({
  children,
  aside,
  collapsible,
  open,
  onToggle,
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-base font-semibold tracking-tight transition-colors hover:text-ink-soft"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
          />
          {children}
        </button>
      ) : (
        <h2 className="text-base font-semibold tracking-tight">{children}</h2>
      )}
      {aside != null && (
        <span className="text-sm text-ink-soft">{aside}</span>
      )}
    </div>
  )
}

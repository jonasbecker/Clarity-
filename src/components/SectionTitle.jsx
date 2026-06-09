// Kleine, wiederverwendbare Überschrift für die Bereiche der Seite.
// Optional rechts ein `aside` (z.B. eine Anzahl).
export default function SectionTitle({ children, aside }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-base font-semibold tracking-tight">{children}</h2>
      {aside != null && (
        <span className="text-sm text-ink-soft">{aside}</span>
      )}
    </div>
  )
}

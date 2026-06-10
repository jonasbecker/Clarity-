// Lade-Platzhalter: pulsierende Balken/Karten statt "Lädt …"-Text.
export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded-full bg-line ${className}`} />
}

// Eine Zeile wie in TaskList/CompletedTasks: Kreis + zwei Zeilen Text.
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="size-5 shrink-0 animate-pulse rounded-full bg-line" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3.5 w-3/4" />
        <SkeletonLine className="h-2.5 w-1/2" />
      </div>
    </div>
  )
}

// Eine Karte wie FocusCard: Bereichs-Label, Titel, Fußzeile.
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <SkeletonLine className="h-2.5 w-1/3" />
      <SkeletonLine className="mt-3 h-4 w-3/4" />
      <SkeletonLine className="mt-4 h-3 w-1/2" />
    </div>
  )
}

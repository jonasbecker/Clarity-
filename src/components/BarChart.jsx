// Abhängigkeitsfreies Balkendiagramm (reine Divs).
//
// `orientation="horizontal"` (Standard): Label + Track + Fülllevel + Wert,
// für Bereichs-/Tageszeit-Vergleiche.
// `orientation="vertical"`: Säulen mit Label darunter, für den Wochentrend.
// `onSelect(item)` (optional): macht horizontale Zeilen klickbar (z.B. um die
// Task-Liste nach Bereich zu filtern).
// Prozente sind relativ zu `Math.max(...values, 1)`.
export default function BarChart({ data, orientation = 'horizontal', height = 120, onSelect }) {
  const max = Math.max(...data.map((d) => d.value), 1)

  if (orientation === 'vertical') {
    return (
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-ink/70"
                style={{ height: `${(d.value / max) * 100}%` }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <span className="text-[10px] text-ink-soft">{d.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const row = (
          <>
            <span className="w-24 shrink-0 truncate text-ink-soft">{d.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  backgroundColor: d.color ?? 'var(--color-ink)',
                }}
              />
            </div>
            <span className="w-5 shrink-0 text-right text-xs text-ink-soft">{d.value}</span>
          </>
        )
        return onSelect ? (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(d)}
            className="flex w-full items-center gap-3 rounded-lg px-1 py-0.5 text-left text-sm transition-colors hover:bg-surface"
          >
            {row}
          </button>
        ) : (
          <div key={i} className="flex items-center gap-3 text-sm">
            {row}
          </div>
        )
      })}
    </div>
  )
}

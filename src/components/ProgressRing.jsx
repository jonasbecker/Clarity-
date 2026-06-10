// Kompakter Fortschrittsring (reines SVG, keine Chart-Bibliothek nötig).
// Zeigt `done`/`total` als Ring + Zahl in der Mitte. Ohne Tasks (total === 0)
// bleibt der Ring neutral grau.
export default function ProgressRing({ done, total, size = 56, stroke = 5 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? Math.min(done / total, 1) : 0
  const offset = circumference * (1 - pct)

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${done} von ${total} heute erledigt`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        {total > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        )}
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-semibold tabular-nums">
        {done}/{total}
      </span>
    </div>
  )
}

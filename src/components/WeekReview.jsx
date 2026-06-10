import { areas } from '../data/dummyData.js'

// Kompakte Wochenbilanz: wie viele Tasks in den letzten 7 Tagen erledigt
// wurden, aufgeteilt nach Bereich, plus Streak (Tage in Folge mit
// mindestens einer erledigten Task). Erscheint erst, sobald es etwas zu
// zeigen gibt.
export default function WeekReview({ stats }) {
  if (stats.total === 0) return null

  return (
    <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
      <span className="font-medium">Diese Woche {stats.total} erledigt</span>

      <div className="flex items-center gap-3">
        {Object.entries(stats.byArea)
          .filter(([, count]) => count > 0)
          .map(([id, count]) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 text-ink-soft"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: areas[id].color }}
                aria-hidden="true"
              />
              {count}
            </span>
          ))}
      </div>

      {stats.streak > 1 && (
        <span className="ml-auto text-ink-soft">
          🔥 {stats.streak} Tage in Folge
        </span>
      )}
    </div>
  )
}

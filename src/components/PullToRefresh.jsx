import { RefreshCw } from 'lucide-react'

// Sichtbarer Indikator fürs Pull-to-Refresh: ein Kreis-Pfeil, der beim Ziehen
// erscheint und sich beim Aktualisieren dreht. Die Mechanik steckt im Hook
// usePullToRefresh; hier wird nur `distance`/`refreshing` dargestellt.
export default function PullToRefresh({ distance, refreshing, active }) {
  if (distance <= 0 && !refreshing) return null
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
      style={{ transform: `translateY(${Math.max(0, distance - 24)}px)` }}
    >
      <div className="mt-2 grid size-9 place-items-center rounded-full border border-line bg-surface text-ink-soft shadow-sm">
        <RefreshCw
          size={17}
          className={refreshing ? 'animate-spin' : ''}
          style={
            refreshing
              ? undefined
              : { transform: `rotate(${distance * 3}deg)`, opacity: active ? 1 : 0.6 }
          }
        />
      </div>
    </div>
  )
}

import { Calendar, RefreshCw } from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import TimelineItem from './TimelineItem.jsx'

// Kompakter Tagesplan. Zeigt je nach Verbindungs-Status:
// - 'unconfigured' → Beispiel-Termine (fallbackEvents)
// - 'idle'/'error' → Knopf "Mit Google Kalender verbinden"
// - 'loading'      → Ladehinweis
// - 'connected'    → echte Termine (oder "keine Termine heute")
export default function Timeline({
  status,
  events,
  fallbackEvents,
  error,
  onConnect,
}) {
  const list = status === 'connected' ? events : fallbackEvents

  // Hinweis rechts neben der Überschrift.
  const aside =
    status === 'connected'
      ? `${events.length} Termine`
      : status === 'unconfigured'
        ? 'Beispiel'
        : ''

  return (
    <section className="mb-10">
      <SectionTitle aside={aside}>Dein Tag</SectionTitle>

      {status === 'idle' || status === 'error' ? (
        <ConnectCard onConnect={onConnect} error={error} />
      ) : status === 'loading' ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          Kalender lädt …
        </p>
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          Keine Termine heute. Genieß den freien Tag ✨
        </p>
      ) : (
        <ul className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          {list.map((event) => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </ul>
      )}
    </section>
  )
}

// Aufforderung, den Google-Kalender zu verbinden.
function ConnectCard({ onConnect, error }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
      <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-canvas">
        <Calendar size={20} className="text-area-work" />
      </div>
      <p className="font-medium">Deinen Google Kalender verbinden</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-ink-soft">
        Zeig deine echten Termine von heute hier in der Timeline. Nur Lesezugriff.
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}
      <button
        type="button"
        onClick={onConnect}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 font-medium text-white"
      >
        {error ? <RefreshCw size={16} /> : <Calendar size={16} />}
        {error ? 'Erneut versuchen' : 'Mit Google Kalender verbinden'}
      </button>
    </div>
  )
}

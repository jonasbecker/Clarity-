import { areas } from '../data/dummyData.js'

// Eine Zeile in der Tages-Timeline: Zeit links, farbiger Punkt, Termin.
// Funktioniert für Dummy-Events (mit `area`) UND echte Kalender-Events
// (ohne `area` → neutraler Punkt, evtl. ganztägig).
export default function TimelineItem({ event }) {
  const color = event.area ? areas[event.area].color : '#94a3b8' // neutrales Slate

  return (
    <li className="flex gap-3">
      {/* Zeitspalte */}
      <div className="w-12 shrink-0 pt-0.5 text-right text-sm tabular-nums text-ink-soft">
        {event.allDay ? '·' : event.start}
      </div>

      {/* Punkt + verbindende Linie */}
      <div className="relative flex flex-col items-center">
        <span
          className="mt-1.5 size-2.5 rounded-full ring-4 ring-canvas"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="w-px grow bg-line" aria-hidden="true" />
      </div>

      {/* Termin */}
      <div className="pb-5">
        <p className="font-medium leading-snug">{event.title}</p>
        <p className="text-sm text-ink-soft">
          {event.allDay ? 'ganztägig' : `${event.start} – ${event.end}`}
        </p>
      </div>
    </li>
  )
}

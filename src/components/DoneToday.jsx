import { PartyPopper } from 'lucide-react'
import { formatDuration } from '../lib/scheduler.js'

// „Done for the Day": erscheint, wenn alle heute eingeplanten Aufgaben erledigt
// sind. Ein ruhiger, befriedigender Abschluss-Screen mit der heute fokussiert
// gelernten Zeit (aus den Ist-Zeiten, sonst den geschätzten Dauern).
export default function DoneToday({ count, minutes }) {
  return (
    <section className="mb-10">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-10 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-canvas text-area-study">
          <PartyPopper size={26} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Für heute geschafft!</h2>
        <p className="max-w-xs text-sm text-ink-soft">
          {minutes > 0 ? (
            <>
              Du hast heute <span className="font-medium text-ink">{formatDuration(minutes)}</span>{' '}
              fokussiert gelernt
              {count > 0 && <> und {count} Aufgabe{count === 1 ? '' : 'n'} erledigt</>}. Genieß den Feierabend.
            </>
          ) : (
            <>Alle heute geplanten Aufgaben sind erledigt. Genieß den Feierabend.</>
          )}
        </p>
      </div>
    </section>
  )
}

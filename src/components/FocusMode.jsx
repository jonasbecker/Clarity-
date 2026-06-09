import { useEffect, useState } from 'react'
import { Check, X, ArrowRight } from 'lucide-react'
import { areas } from '../data/dummyData.js'
import { formatDueLabel } from '../lib/date.js'

// Fokus-Modus: eine Task groß, alles andere ausgeblendet.
//
// Wir nehmen beim Öffnen eine Momentaufnahme der Tasks (useState-Startwert),
// damit das Durchblättern stabil bleibt, auch wenn sich die Live-Liste
// ändert. `onToggle` speichert das Abhaken trotzdem in der echten Liste.
export default function FocusMode({ tasks, onToggle, onClose }) {
  const [queue] = useState(tasks)
  const [index, setIndex] = useState(0)

  // Escape schließt.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const task = queue[index]
  const done = index >= queue.length

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      {/* Kopfzeile: Fortschritt + Schließen */}
      <div className="flex items-center justify-between px-5 py-5 sm:px-8">
        <span className="text-sm font-medium text-ink-soft">
          {done ? 'Fertig' : `${index + 1} / ${queue.length}`}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fokus-Modus schließen"
          className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
        >
          <X size={20} />
        </button>
      </div>

      {/* Mitte: die eine Task — oder der Abschluss */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {done ? (
          <>
            <div className="text-5xl">🎉</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Durch für jetzt!
            </h2>
            <p className="mt-2 text-ink-soft">Gut gemacht. Zeit durchzuatmen.</p>
          </>
        ) : (
          <>
            <span
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: areas[task.area].color }}
            >
              {areas[task.area].label}
            </span>
            <h2 className="mt-3 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {task.title}
            </h2>
            {task.description && (
              <p className="mt-3 max-w-md text-ink-soft">{task.description}</p>
            )}
            {task.due_date && (
              <p className="mt-3 text-sm text-ink-soft">
                Fällig: {formatDueLabel(task.due_date)}
              </p>
            )}
          </>
        )}
      </div>

      {/* Fußzeile: Aktionen */}
      <div className="px-6 pb-10 sm:pb-14">
        {done ? (
          <button
            type="button"
            onClick={onClose}
            className="mx-auto block w-full max-w-sm rounded-xl bg-ink py-4 font-medium text-white"
          >
            Schließen
          </button>
        ) : (
          <div className="mx-auto flex w-full max-w-sm gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface py-4 font-medium text-ink-soft transition-colors hover:text-ink"
            >
              Weiter
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                onToggle(task.id) // in der echten Liste als erledigt speichern
                setIndex((i) => i + 1)
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink py-4 font-medium text-white"
            >
              <Check size={18} strokeWidth={2.5} />
              Erledigt
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

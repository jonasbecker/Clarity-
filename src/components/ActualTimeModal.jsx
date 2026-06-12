import { useEffect, useState } from 'react'
import { Clock, X } from 'lucide-react'

// Kurze Abfrage beim Abhaken einer Lernaufgabe: „Wie lange hat's wirklich
// gedauert?" Die Antwort (actual_min) füttert die lernende Dauer-Schätzung für
// ähnliche Aufgaben. Vorausgewählt ist die ursprüngliche Schätzung — ein Tippen
// genügt, „Überspringen" lässt es offen. Bottom-Sheet, mobil optimiert.
const CHOICES = [10, 15, 20, 30, 45, 60, 90, 120, 180]

export default function ActualTimeModal({ task, onSave, onSkip }) {
  const estimate = task?.duration_min ?? 30
  const [value, setValue] = useState(estimate)

  // Bei neuem Task die Vorauswahl auf dessen Schätzung zurücksetzen.
  useEffect(() => {
    setValue(task?.duration_min ?? 30)
  }, [task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return null

  // Auswahl-Chips: Standardwerte plus die Schätzung (falls nicht enthalten).
  const choices = CHOICES.includes(estimate)
    ? CHOICES
    : [...CHOICES, estimate].sort((a, b) => a - b)

  function save() {
    const n = Math.round(Number(value))
    if (Number.isFinite(n) && n > 0) onSave(Math.min(1440, n))
    else onSkip()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center"
      onClick={onSkip}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tatsächliche Dauer erfassen"
        onClick={(e) => e.stopPropagation()}
        className="w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-xl sm:max-w-sm sm:rounded-3xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Clock size={18} className="text-ink-soft" />
              Wie lange hat's gedauert?
            </h2>
            <p className="mt-1 truncate text-sm text-ink-soft">{task.title}</p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            aria-label="Überspringen"
            className="grid size-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-canvas"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {choices.map((d) => {
            const active = Number(value) === d
            const label = d < 60 ? `${d} Min` : d % 60 === 0 ? `${d / 60} Std` : `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')} Std`
            return (
              <button
                key={d}
                type="button"
                onClick={() => setValue(d)}
                className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
                  active
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line text-ink-soft hover:border-ink/30'
                }`}
              >
                {label}
                {d === estimate && (
                  <span className={active ? 'opacity-70' : 'text-ink-soft'}> · geschätzt</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Freie Eingabe in Minuten */}
        <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
          oder genau
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-24 rounded-xl border border-line bg-canvas px-3 py-2 text-ink outline-none transition-colors focus:border-ink/30"
          />
          Min
        </label>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-xl bg-ink py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            Speichern
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink/30"
          >
            Überspringen
          </button>
        </div>
      </div>
    </div>
  )
}

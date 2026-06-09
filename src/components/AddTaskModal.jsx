import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { areas } from '../data/dummyData.js'

// Schnell-Erfassen-Formular für eine neue Task.
//
// Lern-Konzepte hier:
// - "Kontrollierte Eingaben" (controlled inputs): der Wert jedes Feldes
//   lebt in einem useState. React ist die einzige Quelle der Wahrheit,
//   nicht das DOM. Tippt man, ruft onChange setState auf → neu rendern.
// - Das Modal weiß NICHT, wie eine Task gespeichert wird. Es ruft beim
//   Absenden nur die Funktion `onAdd` auf, die es als Prop bekommt.
//   (Die TodayView entscheidet, was mit der Task passiert.)
//
// Fälligkeits-Optionen: bewusst als Chips statt freiem Text — simpel und
// passt zum Stil der Dummy-Daten.
const DUE_OPTIONS = ['Heute', 'Morgen', 'Diese Woche']

export default function AddTaskModal({ open, onClose, onAdd }) {
  // Ein State-Stück pro Eingabefeld.
  const [title, setTitle] = useState('')
  const [area, setArea] = useState('study')
  const [due, setDue] = useState(null)

  // Mit Escape schließen + Hintergrund-Scrollen sperren, solange offen.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const trimmed = title.trim()
  const canSubmit = trimmed.length > 0

  function handleSubmit(e) {
    e.preventDefault() // Standard-Neuladen der Seite verhindern.
    if (!canSubmit) return
    onAdd({ title: trimmed, area, due })
    // Felder für die nächste Eingabe zurücksetzen und schließen.
    setTitle('')
    setArea('study')
    setDue(null)
    onClose()
  }

  return (
    // Backdrop: Klick daneben schließt. Auf dem Handy sitzt das Sheet
    // unten, auf dem Desktop mittig.
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Neue Task erfassen"
        // stopPropagation: Klick INS Formular soll nicht schließen.
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl bg-surface p-6 shadow-xl sm:max-w-md sm:rounded-3xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Neue Task</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="grid size-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-canvas"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Titel */}
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Was möchtest du erledigen?"
            className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-base outline-none transition-colors focus:border-ink/30"
          />

          {/* Bereich: Segment-Buttons mit Akzentfarbe */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">Bereich</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(areas).map((a) => {
              const active = area === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setArea(a.id)}
                  className="rounded-xl border-2 py-2 text-sm font-medium transition-colors"
                  style={{
                    borderColor: active ? a.color : 'var(--color-line)',
                    color: active ? a.color : 'var(--color-ink-soft)',
                    backgroundColor: active ? `${a.color}14` : 'transparent',
                  }}
                >
                  {a.label}
                </button>
              )
            })}
          </div>

          {/* Fällig: optionale Chips, nochmal Tippen hebt die Auswahl auf */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Fällig <span className="font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {DUE_OPTIONS.map((opt) => {
              const active = due === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDue(active ? null : opt)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-ink bg-ink text-white'
                      : 'border-line text-ink-soft hover:border-ink/30'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {/* Absenden: deaktiviert, solange kein Titel da ist */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-7 w-full rounded-xl bg-ink py-3.5 font-medium text-white transition-opacity disabled:opacity-40"
          >
            Task hinzufügen
          </button>
        </form>
      </div>
    </div>
  )
}

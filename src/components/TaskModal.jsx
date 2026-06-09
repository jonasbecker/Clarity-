import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { areas } from '../data/dummyData.js'
import { isoInDays } from '../lib/date.js'

// Formular zum Erfassen ODER Bearbeiten einer Task.
//
// Ein Modal für beides: ohne `task` ist es "neu", mit `task` ist es
// "bearbeiten" (Felder vorausgefüllt, Speichern statt Hinzufügen, plus
// Löschen-Knopf).
//
// Fälligkeit wird als echtes Datum ('YYYY-MM-DD') gespeichert. Die Chips
// "Heute/Morgen/Übermorgen" sind nur Schnellwege, die dieses Datum setzen;
// über das Kalender-Feld lässt sich jeder beliebige Tag wählen.
const QUICK = [
  { label: 'Heute', days: 0 },
  { label: 'Morgen', days: 1 },
  { label: 'Übermorgen', days: 2 },
]

export default function TaskModal({ open, onClose, onSubmit, onDelete, task }) {
  const isEdit = Boolean(task)
  const [title, setTitle] = useState('')
  const [area, setArea] = useState('study')
  const [dueDate, setDueDate] = useState(null) // 'YYYY-MM-DD' oder null
  const [description, setDescription] = useState('')

  // Beim Öffnen die Felder passend füllen: leer (neu) oder aus der Task.
  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setArea(task?.area ?? 'study')
    setDueDate(task?.due_date ?? null)
    setDescription(task?.description ?? '')
  }, [open, task])

  // Escape schließt + Hintergrund-Scrollen sperren, solange offen.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
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
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      title: trimmed,
      area,
      due_date: dueDate,
      description: description.trim() || null,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Task bearbeiten' : 'Neue Task erfassen'}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-xl sm:max-w-md sm:rounded-3xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? 'Task bearbeiten' : 'Neue Task'}
          </h2>
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

          {/* Beschreibung (optional) */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung (optional)"
            rows={3}
            className="mt-3 w-full resize-none rounded-xl border border-line bg-canvas px-4 py-3 text-sm outline-none transition-colors focus:border-ink/30"
          />

          {/* Bereich */}
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

          {/* Fällig: Schnell-Chips + Kalender-Feld */}
          <div className="mb-2 mt-5 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-soft">
              Fällig <span className="font-normal">(optional)</span>
            </p>
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate(null)}
                className="text-xs text-ink-soft underline-offset-2 hover:underline"
              >
                entfernen
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => {
              const iso = isoInDays(q.days)
              const active = dueDate === iso
              return (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setDueDate(active ? null : iso)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-ink bg-ink text-white'
                      : 'border-line text-ink-soft hover:border-ink/30'
                  }`}
                >
                  {q.label}
                </button>
              )
            })}
          </div>
          {/* Kalender: beliebigen Tag wählen */}
          <input
            type="date"
            value={dueDate || ''}
            onChange={(e) => setDueDate(e.target.value || null)}
            className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink/30"
          />

          {/* Absenden */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-7 w-full rounded-xl bg-ink py-3.5 font-medium text-white transition-opacity disabled:opacity-40"
          >
            {isEdit ? 'Speichern' : 'Task hinzufügen'}
          </button>

          {/* Löschen nur im Bearbeiten-Modus */}
          {isEdit && (
            <button
              type="button"
              onClick={() => {
                onDelete(task.id)
                onClose()
              }}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 size={15} />
              Task löschen
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

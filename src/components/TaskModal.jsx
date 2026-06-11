import { useEffect, useState } from 'react'
import { Mic, Trash2, X, Plus, Tag } from 'lucide-react'
import { areas } from '../data/dummyData.js'
import { isoInDays } from '../lib/date.js'
import { useSpeech } from '../lib/useSpeech.js'
import { addSubtask, toggleSubtask, removeSubtask } from '../lib/subtasks.js'
import { addTag, removeTag } from '../lib/tags.js'
import { REPEAT_PRESETS, WEEKDAYS, parseDays, buildDaysRepeat } from '../lib/repeat.js'

// Geschätzte Dauer (Minuten) — der Tagesplan platziert die Task entsprechend.
const DURATIONS = [15, 30, 45, 60, 90, 120]

// Priorität — visuell zurückhaltend, hebt nur "Hoch" hervor.
const PRIORITIES = [
  { id: 'low', label: 'Niedrig' },
  { id: 'medium', label: 'Mittel' },
  { id: 'high', label: 'Hoch' },
]

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

export default function TaskModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  onSaveTemplate,
  task,
}) {
  const isEdit = Boolean(task)
  const [title, setTitle] = useState('')
  const [area, setArea] = useState('study')
  const [dueDate, setDueDate] = useState(null) // 'YYYY-MM-DD' oder null
  const [description, setDescription] = useState('')
  const [repeat, setRepeat] = useState(null) // siehe lib/repeat.js
  const [customDays, setCustomDays] = useState(false) // Wochentag-Auswahl offen?
  const [duration, setDuration] = useState(30) // geschätzte Dauer in Minuten
  const [priority, setPriority] = useState('medium') // 'low' | 'medium' | 'high'
  const [subtasks, setSubtasks] = useState([]) // [{ id, title, done }]
  const [newSubtask, setNewSubtask] = useState('')
  const [tags, setTags] = useState([]) // ["Uni", "dringend"]
  const [newTag, setNewTag] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)

  // Sprach-Eingabe: das Gesprochene landet direkt im Titel-Feld.
  const speech = useSpeech({ onResult: (text) => setTitle(text) })

  // Beim Öffnen die Felder passend füllen: leer (neu) oder aus der Task.
  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setArea(task?.area ?? 'study')
    setDueDate(task?.due_date ?? null)
    setDescription(task?.description ?? '')
    setRepeat(task?.repeat ?? null)
    setCustomDays(typeof task?.repeat === 'string' && task.repeat.startsWith('days:'))
    setDuration(task?.duration_min ?? 30)
    setPriority(task?.priority ?? 'medium')
    setSubtasks(Array.isArray(task?.subtasks) ? task.subtasks : [])
    setNewSubtask('')
    setTags(Array.isArray(task?.tags) ? task.tags : [])
    setNewTag('')
    setSaveAsTemplate(false)
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
      speech.stop() // beim Schließen das Mikrofon nicht weiterlaufen lassen
    }
  }, [open, onClose])

  if (!open) return null

  const trimmed = title.trim()
  const canSubmit = trimmed.length > 0

  function handleAddSubtask() {
    if (!newSubtask.trim()) return
    setSubtasks((cur) => addSubtask(cur, newSubtask))
    setNewSubtask('')
  }

  function handleAddTag() {
    if (!newTag.trim()) return
    setTags((cur) => addTag(cur, newTag))
    setNewTag('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      title: trimmed,
      area,
      due_date: dueDate,
      description: description.trim() || null,
      repeat,
      duration_min: duration,
      priority,
      subtasks,
      tags,
    })
    // Beim Anlegen optional als Vorlage merken (ohne Fälligkeit).
    if (!isEdit && saveAsTemplate && onSaveTemplate) {
      onSaveTemplate({
        title: trimmed,
        area,
        duration_min: duration,
        description: description.trim() || null,
        repeat,
      })
    }
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
          {/* Titel — mit optionalem Mikrofon-Knopf zum Einsprechen */}
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Was möchtest du erledigen?"
              className={`w-full rounded-xl border border-line bg-canvas px-4 py-3 text-base outline-none transition-colors focus:border-ink/30 ${
                speech.supported ? 'pr-12' : ''
              }`}
            />
            {speech.supported && (
              <button
                type="button"
                onClick={() => (speech.listening ? speech.stop() : speech.start())}
                aria-label={speech.listening ? 'Aufnahme stoppen' : 'Task einsprechen'}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full transition-colors hover:bg-surface"
              >
                <Mic
                  size={18}
                  className={
                    speech.listening
                      ? 'animate-pulse text-danger'
                      : 'text-ink-soft'
                  }
                />
              </button>
            )}
          </div>
          {speech.listening && (
            <p className="mt-1.5 px-1 text-xs text-ink-soft">
              Hört zu … sprich deine Task.
            </p>
          )}

          {/* Beschreibung (optional) */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung (optional)"
            rows={3}
            className="mt-3 w-full resize-none rounded-xl border border-line bg-canvas px-4 py-3 text-sm outline-none transition-colors focus:border-ink/30"
          />

          {/* Subtasks / Checkliste (optional) */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Checkliste <span className="font-normal">(optional)</span>
          </p>
          {subtasks.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {subtasks.map((s) => (
                <li key={s.id} className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => setSubtasks((cur) => toggleSubtask(cur, s.id))}
                    className="size-4 shrink-0 accent-[var(--color-ink)]"
                  />
                  <span
                    className={`min-w-0 flex-1 text-sm ${
                      s.done ? 'text-ink-soft line-through' : ''
                    }`}
                  >
                    {s.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubtasks((cur) => removeSubtask(cur, s.id))}
                    aria-label="Schritt entfernen"
                    className="shrink-0 text-ink-soft transition-colors hover:text-danger"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddSubtask()
                }
              }}
              placeholder="Schritt hinzufügen …"
              className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink/30"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              aria-label="Schritt hinzufügen"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
            >
              <Plus size={18} />
            </button>
          </div>

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

          {/* Dauer (für den Tagesplan) */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Dauer <span className="font-normal">(für den Tagesplan)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => {
              const active = duration === d
              const label = d < 60 ? `${d} Min` : d === 60 ? '1 Std' : `${d / 60} Std`
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-line text-ink-soft hover:border-ink/30'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Priorität */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">Priorität</p>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => {
              const active = priority === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-line text-ink-soft hover:border-ink/30'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Tags / Schlagwörter (optional) */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Tags <span className="font-normal">(optional)</span>
          </p>
          {tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-xs text-ink-soft"
                >
                  <Tag size={11} />
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags((cur) => removeTag(cur, t))}
                    aria-label={`Tag ${t} entfernen`}
                    className="transition-colors hover:text-danger"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              placeholder="Tag hinzufügen …"
              className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink/30"
            />
            <button
              type="button"
              onClick={handleAddTag}
              aria-label="Tag hinzufügen"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
            >
              <Plus size={18} />
            </button>
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
                      ? 'border-ink bg-ink text-canvas'
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

          {/* Wiederholung */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Wiederholung
          </p>
          <div className="flex flex-wrap gap-2">
            {REPEAT_PRESETS.map((r) => {
              const active = !customDays && repeat === r.id
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => {
                    setCustomDays(false)
                    setRepeat(r.id)
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-line text-ink-soft hover:border-ink/30'
                  }`}
                >
                  {r.label}
                </button>
              )
            })}
            {/* "Bestimmte Tage" öffnet die Wochentag-Auswahl */}
            <button
              type="button"
              onClick={() => {
                setCustomDays(true)
                if (!(typeof repeat === 'string' && repeat.startsWith('days:'))) {
                  setRepeat(buildDaysRepeat([new Date().getDay()]))
                }
              }}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                customDays
                  ? 'border-ink bg-ink text-canvas'
                  : 'border-line text-ink-soft hover:border-ink/30'
              }`}
            >
              Bestimmte Tage
            </button>
          </div>

          {/* Wochentag-Auswahl (nur im "Bestimmte Tage"-Modus) */}
          {customDays && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {WEEKDAYS.map((w) => {
                const selected = parseDays(repeat).includes(w.n)
                return (
                  <button
                    key={w.n}
                    type="button"
                    onClick={() => {
                      const cur = parseDays(repeat)
                      const next = selected
                        ? cur.filter((n) => n !== w.n)
                        : [...cur, w.n]
                      setRepeat(buildDaysRepeat(next))
                    }}
                    className={`grid size-9 place-items-center rounded-full border text-xs font-medium transition-colors ${
                      selected
                        ? 'border-ink bg-ink text-canvas'
                        : 'border-line text-ink-soft hover:border-ink/30'
                    }`}
                  >
                    {w.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Als Vorlage merken (nur beim Anlegen) */}
          {!isEdit && onSaveTemplate && (
            <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="size-4 accent-[var(--color-ink)]"
              />
              Als Vorlage für „Schnell hinzufügen" merken
            </label>
          )}

          {/* Absenden */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-5 w-full rounded-xl bg-ink py-3.5 font-medium text-canvas transition-opacity disabled:opacity-40"
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
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-bg"
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

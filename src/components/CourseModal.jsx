import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'

// Auswählbare Akzentfarben für Kurse (CSS-Variablen + ein paar Hex-Töne).
const COURSE_COLORS = [
  'var(--color-area-study)',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
]

// Formular zum Anlegen ODER Bearbeiten eines Kurses/Moduls.
//
// Ein Modal für beides: ohne `course` ist es "neu", mit `course` ist es
// "bearbeiten" (Felder vorausgefüllt, plus Löschen-Knopf). Liegt als eigenes
// Overlay über dem Task-Formular (höherer z-Index), damit man aus dem
// Task-Formular heraus schnell einen Kurs anlegen kann.
export default function CourseModal({ open, course, onClose, onSubmit, onDelete }) {
  const isEdit = Boolean(course)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COURSE_COLORS[0])
  const [semester, setSemester] = useState('')
  const [ects, setEcts] = useState('') // als String im Eingabefeld
  const [grade, setGrade] = useState('') // deutsche Note 1.0–5.0 oder leer
  const [targetDate, setTargetDate] = useState('') // manuelles Lernziel (ISO) oder leer

  useEffect(() => {
    if (!open) return
    setName(course?.name ?? '')
    setColor(course?.color ?? COURSE_COLORS[0])
    setSemester(course?.semester ?? '')
    setEcts(course?.ects != null ? String(course.ects) : '')
    setGrade(course?.grade != null ? String(course.grade) : '')
    setTargetDate(course?.target_date ?? '')
  }, [open, course])

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

  const trimmed = name.trim()
  const canSubmit = trimmed.length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    const ectsNum = ects.trim() === '' ? null : Number(ects)
    const gradeNum = grade.trim() === '' ? null : Number(grade)
    onSubmit({
      name: trimmed,
      color,
      semester: semester.trim() || null,
      ects: Number.isFinite(ectsNum) ? ectsNum : null,
      grade: Number.isFinite(gradeNum) ? gradeNum : null,
      target_date: targetDate || null,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Kurs bearbeiten' : 'Neuen Kurs anlegen'}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-xl sm:max-w-md sm:rounded-3xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? 'Kurs bearbeiten' : 'Neuer Kurs'}
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
          {/* Name */}
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kursname, z.B. Statistik II"
            className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-base outline-none transition-colors focus:border-ink/30"
          />

          {/* Farbe */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">Farbe</p>
          <div className="flex flex-wrap gap-2">
            {COURSE_COLORS.map((c) => {
              const active = color === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Farbe ${c}`}
                  aria-pressed={active}
                  className={`size-7 rounded-full transition-transform ${
                    active ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              )
            })}
          </div>

          {/* Semester */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Semester <span className="font-normal">(optional)</span>
          </p>
          <input
            type="text"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            placeholder="z.B. WS25/26"
            className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink/30"
          />

          {/* ECTS + Note */}
          <div className="mt-5 flex gap-3">
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium text-ink-soft">
                ECTS <span className="font-normal">(optional)</span>
              </p>
              <input
                type="number"
                min="0"
                max="300"
                value={ects}
                onChange={(e) => setEcts(e.target.value)}
                placeholder="z.B. 6"
                className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink/30"
              />
            </div>
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium text-ink-soft">
                Note <span className="font-normal">(optional)</span>
              </p>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="1.0–5.0"
                className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink/30"
              />
            </div>
          </div>

          {/* Zieldatum (für die Pace-Planung, falls keine Klausur existiert) */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Zieldatum <span className="font-normal">(optional)</span>
          </p>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink/30"
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            Lernziel für die Pace-Planung, falls der Kurs keine Klausur hat.
          </p>

          {/* Absenden */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 w-full rounded-xl bg-ink py-3.5 font-medium text-canvas transition-opacity disabled:opacity-40"
          >
            {isEdit ? 'Speichern' : 'Kurs anlegen'}
          </button>

          {/* Löschen nur im Bearbeiten-Modus */}
          {isEdit && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(course.id)
                onClose()
              }}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-bg"
            >
              <Trash2 size={15} />
              Kurs löschen
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

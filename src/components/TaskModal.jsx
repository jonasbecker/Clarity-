import { useEffect, useState } from 'react'
import { Mic, Paperclip, Trash2, X, Plus, Tag, GraduationCap } from 'lucide-react'
import { isoInDays } from '../lib/date.js'
import { useSpeech } from '../lib/useSpeech.js'
import { addSubtask, toggleSubtask, removeSubtask } from '../lib/subtasks.js'
import { addTag, removeTag } from '../lib/tags.js'
import { REPEAT_PRESETS, WEEKDAYS, parseDays, buildDaysRepeat } from '../lib/repeat.js'
import {
  estimateMinutes,
  hasEstimateBasis,
  estimateMinutesByCategory,
  hasCategoryEstimateBasis,
} from '../lib/estimate.js'
import { needsSplit, splitDuration } from '../lib/splitTask.js'
import { isSupportedFile, extractText } from '../lib/fileText.js'
import { CATEGORIES, EVENT_TYPES } from '../lib/operators.js'
import { useTaskAnalysis } from '../lib/useTaskAnalysis.js'

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
  courses = [],
  tasks = [],
  onManageCourse,
  preselectCourse,
}) {
  const isEdit = Boolean(task)
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState(null) // zugeordneter Kurs
  const [kind, setKind] = useState('task') // 'task' | 'exam'
  const [dueDate, setDueDate] = useState(null) // 'YYYY-MM-DD' oder null
  const [description, setDescription] = useState('')
  const [repeat, setRepeat] = useState(null) // siehe lib/repeat.js
  const [customDays, setCustomDays] = useState(false) // Wochentag-Auswahl offen?
  const [duration, setDuration] = useState(30) // geschätzte Dauer in Minuten
  const [durationTouched, setDurationTouched] = useState(false) // selbst gewählt?
  const [priority, setPriority] = useState('medium') // 'low' | 'medium' | 'high'
  const [subtasks, setSubtasks] = useState([]) // [{ id, title, done }]
  const [newSubtask, setNewSubtask] = useState('')
  const [tags, setTags] = useState([]) // ["Uni", "dringend"]
  const [newTag, setNewTag] = useState('')
  const [category, setCategory] = useState('') // Aufgabentyp (als Tag gespeichert)
  const [eventType, setEventType] = useState('') // Veranstaltungsart (als Tag gespeichert)
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)

  // Datei-Upload (optional): die KI schätzt daraus Dauer, Schwierigkeit & Art.
  // Die Datei selbst wird nicht gespeichert, nur der extrahierte Text.
  const [fileName, setFileName] = useState(null)
  const [fileText, setFileText] = useState('')
  const [fileError, setFileError] = useState(null)
  const [fileBusy, setFileBusy] = useState(false)
  const analysis = useTaskAnalysis()

  // Sprach-Eingabe: das Gesprochene landet direkt im Titel-Feld.
  const speech = useSpeech({ onResult: (text) => setTitle(text) })

  // Beim Öffnen die Felder passend füllen: leer (neu) oder aus der Task.
  useEffect(() => {
    if (!open) return
    setTitle(task?.title ?? '')
    setCourseId(task?.course_id ?? null)
    setKind(task?.kind === 'exam' ? 'exam' : 'task')
    setDueDate(task?.due_date ?? null)
    setDescription(task?.description ?? '')
    setRepeat(task?.repeat ?? null)
    setCustomDays(typeof task?.repeat === 'string' && task.repeat.startsWith('days:'))
    setDuration(task?.duration_min ?? 30)
    setDurationTouched(isEdit) // bestehende Dauer nicht überschreiben
    setPriority(task?.priority ?? 'medium')
    setSubtasks(Array.isArray(task?.subtasks) ? task.subtasks : [])
    setNewSubtask('')
    const initialTags = Array.isArray(task?.tags) ? task.tags : []
    setTags(initialTags)
    setNewTag('')
    // Kategorie + Veranstaltungsart aus den Tags ableiten.
    setCategory(
      CATEGORIES.find((c) =>
        initialTags.some((t) => String(t).toLowerCase() === c.toLowerCase()),
      ) ?? '',
    )
    setEventType(
      EVENT_TYPES.find((e) =>
        initialTags.some((t) => String(t).toLowerCase() === e.toLowerCase()),
      ) ?? '',
    )
    setSaveAsTemplate(false)
    setFileName(null)
    setFileText('')
    setFileError(null)
    setFileBusy(false)
    analysis.reset()
  }, [open, task])

  // Wurde gerade aus diesem Formular heraus ein neuer Kurs angelegt, ihn
  // direkt auswählen (preselectCourse trägt id + key, damit es erneut greift).
  useEffect(() => {
    if (preselectCourse?.id) setCourseId(preselectCourse.id)
  }, [preselectCourse])

  // Lernende Schätzung: bei einer NEUEN Aufgabe die Dauer aus den bisherigen
  // Ist-Zeiten ähnlicher Aufgaben vorschlagen — solange du sie nicht selbst
  // gewählt hast. Aktualisiert sich live beim Tippen des Titels.
  const estimate = estimateMinutes(title, courseId, tasks)
  const fromEstimate =
    !isEdit && title.trim() && hasEstimateBasis(title, courseId, tasks)
  useEffect(() => {
    if (!isEdit && !durationTouched) setDuration(estimate)
  }, [estimate, isEdit, durationTouched])

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

  // Datei auswählen: Text extrahieren (txt/md direkt, pdf über pdf.js).
  async function handleFileChange(e) {
    const f = e.target.files?.[0]
    e.target.value = '' // gleiche Datei erneut auswählbar machen
    if (!f) return
    analysis.reset()
    if (!isSupportedFile(f)) {
      setFileError('Nur .txt, .md oder .pdf werden unterstützt.')
      setFileName(null)
      setFileText('')
      return
    }
    setFileError(null)
    setFileName(f.name)
    setFileBusy(true)
    try {
      setFileText(await extractText(f))
    } catch {
      setFileError('Datei konnte nicht gelesen werden.')
      setFileName(null)
      setFileText('')
    } finally {
      setFileBusy(false)
    }
  }

  // KI-Analyse anstoßen — das Ergebnis erscheint als Vorschlags-Karte, die
  // Formularfelder bleiben bis zum bewussten "Übernehmen" unverändert. Ist
  // noch kein Kurs gewählt, bekommt die KI die vorhandenen Fächer mit, um eines
  // zuzuordnen; sonst dient der gewählte Kurs als Kontext.
  async function handleAnalyzeFile() {
    const courseName = courses.find((c) => c.id === courseId)?.name
    await analysis.analyze({
      title: trimmed,
      courseName,
      text: fileText,
      courseNames: courseId ? [] : courses.map((c) => c.name),
    })
  }

  // Für die gelernte Dauer den effektiven Kurs nutzen: ein erkanntes Fach ist
  // spezifischer als gar keiner.
  const detectedCourseId = analysis.result?.course
    ? courses.find((c) => c.name === analysis.result.course)?.id
    : null
  const effectiveCourseId = courseId || detectedCourseId || null

  // Gelernte Dauer: zuerst die Veranstaltungsart-Historie (z.B. "Übung"),
  // dann die Kategorie-Historie — beides aus deinen bisherigen Ist-Zeiten,
  // bevorzugt im selben Fach. Sonst die KI-Schätzung.
  const historyTag = analysis.result
    ? [analysis.result.eventType, analysis.result.category].find(
        (t) => t && hasCategoryEstimateBasis(t, effectiveCourseId, tasks),
      )
    : null
  const durationFromHistory = !!historyTag
  const suggestedDuration = analysis.result
    ? durationFromHistory
      ? estimateMinutesByCategory(historyTag, effectiveCourseId, tasks, analysis.result.duration_min)
      : analysis.result.duration_min
    : null

  // Vorschlag übernehmen: Dauer (ggf. die gelernte), Priorität, Art, Kategorie,
  // Veranstaltungsart und — falls noch keiner gewählt — das erkannte Fach
  // setzen; Kurzfassung an die Beschreibung anhängen. Die Tags werden erst
  // beim Speichern aus `category`/`eventType` konsolidiert.
  function applySuggestion() {
    const res = analysis.result
    if (!res) return
    setDuration(suggestedDuration)
    setDurationTouched(true)
    setPriority(res.priority)
    setKind(res.kind)
    if (res.category) setCategory(res.category)
    if (res.eventType) setEventType(res.eventType)
    if (!courseId && detectedCourseId) setCourseId(detectedCourseId)
    if (res.summary) {
      setDescription((cur) => (cur.trim() ? `${cur.trim()}\n\n${res.summary}` : res.summary))
    }
    analysis.reset()
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    // Tags konsolidieren: alte Kategorie-/Veranstaltungsart-Tags entfernen,
    // ausgewählte ergänzen — so bleibt immer höchstens EINE Kategorie und EINE
    // Veranstaltungsart als Tag.
    const managed = [...CATEGORIES, ...EVENT_TYPES].map((s) => s.toLowerCase())
    const baseTags = tags.filter((t) => !managed.includes(String(t).toLowerCase()))
    let finalTags = category ? addTag(baseTags, category) : baseTags
    if (eventType) finalTags = addTag(finalTags, eventType)
    onSubmit({
      title: trimmed,
      area: 'study', // reiner Studienplaner — area bleibt intern 'study'
      course_id: courseId,
      kind,
      due_date: dueDate,
      description: description.trim() || null,
      repeat,
      duration_min: duration,
      priority,
      subtasks,
      tags: finalTags,
    })
    // Beim Anlegen optional als Vorlage merken (ohne Fälligkeit).
    if (!isEdit && saveAsTemplate && onSaveTemplate) {
      onSaveTemplate({
        title: trimmed,
        area: 'study',
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

          {/* Datei-Upload (optional): KI schätzt daraus Dauer, Schwierigkeit
              und Art der Aufgabe. Die Datei selbst wird nicht gespeichert. */}
          <label className="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line bg-canvas px-4 py-3 text-sm text-ink-soft transition-colors hover:border-ink/30">
            <Paperclip size={16} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {fileName || 'Aufgabenblatt hochladen (optional, .txt/.md/.pdf)'}
            </span>
            <input type="file" accept=".txt,.md,.pdf" onChange={handleFileChange} className="hidden" />
          </label>
          {fileError && <p className="mt-1.5 text-xs text-danger">{fileError}</p>}
          {fileName && !fileError && !analysis.result && (
            <button
              type="button"
              onClick={handleAnalyzeFile}
              disabled={fileBusy || analysis.status === 'loading'}
              className="mt-2 w-full rounded-xl border border-line py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink/30 disabled:opacity-50"
            >
              {fileBusy
                ? 'Datei wird gelesen …'
                : analysis.status === 'loading'
                  ? 'Analysiere …'
                  : 'Mit KI analysieren'}
            </button>
          )}

          {/* Vorschlags-Karte: zeigt die geschätzte Dauer deutlich VOR der
              Übernahme. Die Formularfelder bleiben unverändert, bis der Nutzer
              „Übernehmen" drückt. */}
          {analysis.result && (
            <div className="mt-3 rounded-xl border border-line bg-canvas p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                KI-Vorschlag
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight">
                ≈ {suggestedDuration} Min
              </p>
              <p className="text-xs text-ink-soft">
                {durationFromHistory
                  ? `aus deinen bisherigen Zeiten für ${historyTag}`
                  : 'KI-Schätzung'}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft">
                  {PRIORITIES.find((p) => p.id === analysis.result.priority)?.label ??
                    'Mittel'}
                </span>
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft">
                  {analysis.result.kind === 'exam' ? 'Klausur' : 'Aufgabe'}
                </span>
                {analysis.result.category && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft">
                    <Tag size={11} />
                    {analysis.result.category}
                  </span>
                )}
                {analysis.result.eventType && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft">
                    <Tag size={11} />
                    {analysis.result.eventType}
                  </span>
                )}
                {!courseId && detectedCourseId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft">
                    <GraduationCap size={11} />
                    {analysis.result.course}
                  </span>
                )}
              </div>
              {analysis.result.summary && (
                <p className="mt-2 text-xs text-ink-soft">
                  „{analysis.result.summary}"
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="flex-1 rounded-xl bg-ink py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
                >
                  Übernehmen
                </button>
                <button
                  type="button"
                  onClick={() => analysis.reset()}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink/30"
                >
                  Verwerfen
                </button>
              </div>
            </div>
          )}

          {/* Subtasks / Checkliste (bei Klausuren: Lernthemen) */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            {kind === 'exam' ? 'Lernthemen' : 'Checkliste'}{' '}
            <span className="font-normal">(optional)</span>
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

          {/* Kurs — optionale Zuordnung zu einem Modul */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Kurs <span className="font-normal">(optional)</span>
          </p>
          <div className="flex gap-2">
            <select
              value={courseId ?? ''}
              onChange={(e) => setCourseId(e.target.value || null)}
              className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none transition-colors focus:border-ink/30"
            >
              <option value="">Kein Kurs</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {onManageCourse && (
              <button
                type="button"
                onClick={() => onManageCourse(null)}
                aria-label="Neuen Kurs anlegen"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
              >
                <Plus size={18} />
              </button>
            )}
          </div>

          {/* Typ: normale Aufgabe oder Klausur (mit Lernthemen) */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">Typ</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'task', label: 'Aufgabe' },
              { id: 'exam', label: 'Klausur' },
            ].map((k) => {
              const active = kind === k.id
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-line text-ink-soft hover:border-ink/30'
                  }`}
                >
                  {k.label}
                </button>
              )
            })}
          </div>

          {/* Dauer (für den Tagesplan) */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Dauer{' '}
            <span className="font-normal">
              {fromEstimate && !durationTouched
                ? '(geschätzt aus deinen Zeiten)'
                : '(für den Tagesplan)'}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => {
              const active = duration === d
              const label = d < 60 ? `${d} Min` : d === 60 ? '1 Std' : `${d / 60} Std`
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDuration(d)
                    setDurationTouched(true)
                  }}
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
          {/* Eigene Dauer (für längere Aufgaben) — wird ab 120 Min automatisch
              in Teile zerlegt. */}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="5"
              step="5"
              value={duration}
              onChange={(e) => {
                setDuration(Math.max(0, Math.floor(Number(e.target.value) || 0)))
                setDurationTouched(true)
              }}
              aria-label="Eigene Dauer in Minuten"
              className="w-24 rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink/30"
            />
            <span className="text-sm text-ink-soft">Minuten</span>
          </div>
          {needsSplit(duration) && (
            <p className="mt-1.5 text-xs text-ink-soft">
              Wird automatisch in {splitDuration(duration).length} Teile à max.
              120 Min zerlegt.
            </p>
          )}

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

          {/* Aufgabentyp / Kategorie — wird als Tag gespeichert und füttert die
              kategorie-basierte Lernschätzung. Erneutes Tippen wählt ab. */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Aufgabentyp <span className="font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(active ? '' : c)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-line text-ink-soft hover:border-ink/30'
                  }`}
                >
                  {c}
                </button>
              )
            })}
          </div>

          {/* Veranstaltungsart — wird als Tag gespeichert (filterbar) und
              füttert die lernende Dauer-Schätzung. Erneutes Tippen wählt ab. */}
          <p className="mb-2 mt-5 text-sm font-medium text-ink-soft">
            Veranstaltungsart <span className="font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((e) => {
              const active = eventType === e
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEventType(active ? '' : e)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-line text-ink-soft hover:border-ink/30'
                  }`}
                >
                  {e}
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
              {kind === 'exam' ? (
                'Klausurdatum'
              ) : (
                <>
                  Fällig <span className="font-normal">(optional)</span>
                </>
              )}
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

import { useEffect, useMemo, useState } from 'react'
import {
  X,
  Pencil,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ListTodo,
  ArrowUpRight,
  Sparkles,
  Archive,
  ArchiveRestore,
} from 'lucide-react'
import KanbanBoard from './KanbanBoard.jsx'
import TaskModal from './TaskModal.jsx'
import { useCoach } from '../lib/useCoach.js'
import { formatGrade } from '../lib/grades.js'
import { formatDueLabel, isOverdue } from '../lib/date.js'
import { formatDuration } from '../lib/scheduler.js'
import { buildSeries, seriesCount } from '../lib/series.js'
import { estimateMinutes, hasEstimateBasis } from '../lib/estimate.js'
import { paceFor } from '../lib/pace.js'
import { Layers } from 'lucide-react'

const TABS = [
  { id: 'inhalt', label: 'Inhalt' },
  { id: 'aufgaben', label: 'Aufgaben' },
  { id: 'termine', label: 'Termine' },
]

// Kompaktes Zieldatum (z.B. „12. Juli") für die Pace-Zeile.
function shortDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' }).format(
    new Date(y, m - 1, d),
  )
}

// Fach-Detailseite: eigene Vollbild-Ansicht je Kurs. Kopf mit Eckdaten,
// wichtige Links und Vorlesungsnotizen (Akkordeon) im Tab "Inhalt", die
// kursbezogenen Aufgaben und Termine in eigenen Tabs.
//
// Notizen/Links liegen direkt am Kurs (jsonb-Felder `lectures`/`links`) und
// werden über `onUpdateCourse(id, changes)` gespeichert — optimistisch, mit
// Demo-Fallback (localStorage). Reiner Text, keine Datei-Uploads.
export default function CourseDetail({
  course,
  tasks,
  courses,
  onClose,
  onEditMeta,
  onUpdateCourse,
  onAddTask,
  onEditTask,
  onToggleTask,
  onDeleteTask,
  onMoveStatus,
  onOpenInToday,
}) {
  const [tab, setTab] = useState('inhalt')
  // Task-Formular innerhalb der Detailseite: `editingTask` null = neue Aufgabe
  // (Kurs vorausgewählt). `taskPick` trägt id + key für die Vorauswahl.
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskPick, setTaskPick] = useState(null)
  const [seriesOpen, setSeriesOpen] = useState(false)
  const coach = useCoach()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Beim Kurswechsel die KI-Empfehlung zurücksetzen.
  useEffect(() => {
    coach.reset()
  }, [course.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const courseTasks = useMemo(
    () => tasks.filter((t) => t.course_id === course.id),
    [tasks, course.id],
  )
  const openTasks = courseTasks.filter((t) => !t.done)
  const dated = courseTasks
    .filter((t) => !t.done && t.due_date)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const color = course.color || 'var(--color-area-study)'
  // Dezente Pace-Rückwärtsplanung (nötige Minuten/Lerntag bis zum Ziel).
  const pace = useMemo(() => paceFor(course, tasks), [course, tasks])

  function openNewTask() {
    setEditingTask(null)
    setTaskPick({ id: course.id, key: Date.now() })
    setTaskModalOpen(true)
  }
  function openEditTask(task) {
    setEditingTask(task)
    setTaskModalOpen(true)
  }
  function handleTaskSubmit(fields) {
    if (editingTask) onEditTask(editingTask.id, fields)
    else onAddTask(fields)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
        {/* Kopf */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <h2 className="truncate text-xl font-semibold tracking-tight">
                {course.name}
              </h2>
            </div>
            <p className="text-sm text-ink-soft">
              {[
                course.semester,
                course.ects != null ? `${course.ects} ECTS` : null,
                `Note ${formatGrade(course.grade)}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {pace && (
              <p
                className={`mt-1 text-sm ${
                  pace.overdue ? 'text-danger' : 'text-ink-soft'
                }`}
              >
                {pace.overdue
                  ? `Ziel ${shortDate(pace.targetDate)} überfällig`
                  : `≈ ${formatDuration(pace.minutesPerDay)}/Tag bis ${shortDate(pace.targetDate)}`}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() =>
                onUpdateCourse(course.id, { archived: !course.archived })
              }
              aria-label={course.archived ? 'Kurs reaktivieren' : 'Kurs archivieren'}
              title={course.archived ? 'Reaktivieren' : 'Archivieren'}
              className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
            >
              {course.archived ? <ArchiveRestore size={17} /> : <Archive size={17} />}
            </button>
            <button
              type="button"
              onClick={() => onEditMeta(course)}
              aria-label="Kurs bearbeiten"
              className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
            >
              <Pencil size={17} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kurs schließen"
              className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {TABS.map((t) => {
            const active = tab === t.id
            const badge =
              t.id === 'aufgaben' && openTasks.length > 0 ? ` (${openTasks.length})` : ''
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-ink text-canvas' : 'text-ink-soft hover:bg-surface'
                }`}
              >
                {t.label}
                {badge}
              </button>
            )
          })}
        </div>

        {tab === 'inhalt' && (
          <>
            <CoachSection
              coach={coach}
              onGenerate={() => coach.generate(course, tasks)}
              onOpenStep={(id) => {
                const t = tasks.find((x) => x.id === id)
                if (t) openEditTask(t)
              }}
            />
            <LinksSection course={course} onUpdateCourse={onUpdateCourse} />
            <LecturesSection course={course} onUpdateCourse={onUpdateCourse} />
          </>
        )}

        {tab === 'aufgaben' && (
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink-soft">Lernaufgaben</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenInToday(course.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30"
                >
                  In „Heute" <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setSeriesOpen((o) => !o)}
                  aria-pressed={seriesOpen}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    seriesOpen
                      ? 'border-ink text-ink'
                      : 'border-line text-ink-soft hover:border-ink/30'
                  }`}
                >
                  <Layers size={13} /> Serie
                </button>
                <button
                  type="button"
                  onClick={openNewTask}
                  className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-canvas transition-opacity hover:opacity-90"
                >
                  <Plus size={13} /> Aufgabe
                </button>
              </div>
            </div>

            {seriesOpen && (
              <SeriesForm
                course={course}
                tasks={tasks}
                onCreate={(items) => {
                  items.forEach((it) => onAddTask(it))
                  setSeriesOpen(false)
                }}
                onCancel={() => setSeriesOpen(false)}
              />
            )}

            {courseTasks.length === 0 ? (
              <EmptyHint icon={ListTodo} text="Noch keine Aufgaben — leg deine erste an." />
            ) : (
              <KanbanBoard
                tasks={courseTasks}
                onToggle={onToggleTask}
                onEdit={openEditTask}
                onDelete={onDeleteTask}
                onMoveStatus={onMoveStatus}
              />
            )}
          </section>
        )}

        {tab === 'termine' && (
          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink-soft">
              Termine & Fristen
            </h3>
            {dated.length === 0 ? (
              <EmptyHint icon={ListTodo} text="Keine datierten Aufgaben oder Klausuren." />
            ) : (
              <ul className="space-y-2">
                {dated.map((t) => {
                  const overdue = isOverdue(t.due_date)
                  return (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium">{t.title}</span>
                      <span
                        className={`shrink-0 text-xs ${overdue ? 'text-danger' : 'text-ink-soft'}`}
                      >
                        {formatDueLabel(t.due_date)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      <TaskModal
        open={taskModalOpen}
        task={editingTask}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        onDelete={onDeleteTask}
        courses={courses}
        tasks={tasks}
        preselectCourse={taskPick}
      />
    </div>
  )
}

// Serien-Generator: aus „Aufgabenblatt" + von/bis viele durchnummerierte
// Aufgaben auf einmal anlegen, alle auf diesen Kurs gebucht. Die Dauer wird
// aus deinen bisherigen Ist-Zeiten ähnlicher Aufgaben vorgeschlagen (sofern
// vorhanden) — du kannst sie überschreiben. Mobil-freundlich: große Felder,
// alles gestapelt.
const SERIES_DURATIONS = [15, 30, 45, 60, 90, 120]

function SeriesForm({ course, tasks, onCreate, onCancel }) {
  const [base, setBase] = useState('')
  const [from, setFrom] = useState(1)
  const [to, setTo] = useState(5)
  const [duration, setDuration] = useState(30)
  const [durationTouched, setDurationTouched] = useState(false)

  // Dauer-Vorschlag aus den bisherigen Ist-Zeiten, solange du sie nicht selbst
  // angefasst hast. Aktualisiert sich live, während du den Titel tippst.
  const suggested = estimateMinutes(base, course.id, tasks)
  const fromEstimate = base.trim() && hasEstimateBasis(base, course.id, tasks)
  useEffect(() => {
    if (!durationTouched) setDuration(suggested)
  }, [suggested, durationTouched])

  const count = base.trim() ? seriesCount(from, to) : 0
  const lo = Math.min(Number(from), Number(to))
  const hi = lo + count - 1

  function submit(e) {
    e.preventDefault()
    const items = buildSeries({
      base,
      from,
      to,
      courseId: course.id,
      durationMin: duration,
    })
    if (items.length > 0) onCreate(items)
  }

  return (
    <form
      onSubmit={submit}
      className="mb-4 rounded-2xl border border-line bg-surface p-4"
    >
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Layers size={15} className="text-ink-soft" />
        Aufgaben-Serie anlegen
      </p>

      <input
        type="text"
        value={base}
        onChange={(e) => setBase(e.target.value)}
        autoFocus
        placeholder="Basistitel, z.B. Aufgabenblatt"
        className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink/30"
      />

      <div className="mt-2 flex items-center gap-2">
        <label className="flex flex-1 items-center gap-2 text-sm text-ink-soft">
          von
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full min-w-0 rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink/30"
          />
        </label>
        <label className="flex flex-1 items-center gap-2 text-sm text-ink-soft">
          bis
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full min-w-0 rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink/30"
          />
        </label>
      </div>

      {/* Dauer je Aufgabe */}
      <p className="mb-1.5 mt-3 text-xs font-medium text-ink-soft">
        Dauer je Aufgabe
        {fromEstimate && !durationTouched && (
          <span className="ml-1 font-normal">· geschätzt aus deinen Zeiten</span>
        )}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {SERIES_DURATIONS.map((d) => {
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

      {/* Vorschau */}
      <p className="mt-3 text-xs text-ink-soft">
        {count > 0
          ? `Legt ${count} Aufgabe${count === 1 ? '' : 'n'} an: „${base.trim()} ${lo}" … „${base.trim()} ${hi}"`
          : 'Gib einen Basistitel ein.'}
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={count === 0}
          className="flex-1 rounded-xl bg-ink py-2.5 text-sm font-medium text-canvas transition-opacity disabled:opacity-40"
        >
          {count > 0 ? `${count} Aufgaben anlegen` : 'Aufgaben anlegen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink/30"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}

function EmptyHint({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
      <Icon size={18} />
      <p>{text}</p>
    </div>
  )
}

// KI-Studiencoach: empfiehlt per Knopfdruck die effizienteste Lernmethode für
// diesen Kurs und eine priorisierte Schrittliste. Aufruf nur auf Wunsch
// (schont das kostenlose Groq-Kontingent); ohne Server-Funktion (lokal/ohne
// Key) erscheint ein freundlicher Hinweis.
function CoachSection({ coach, onGenerate, onOpenStep }) {
  const { advice, status, error } = coach
  return (
    <section className="mb-8 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles size={16} className="text-ink-soft" />
          KI-Studiencoach
        </h3>
        <button
          type="button"
          onClick={onGenerate}
          disabled={status === 'loading'}
          className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === 'loading'
            ? 'Denkt nach …'
            : status === 'ready'
              ? 'Neu fragen'
              : 'KI-Empfehlung'}
        </button>
      </div>

      {status === 'idle' && (
        <p className="mt-2 text-sm text-ink-soft">
          Lass dir vorschlagen, wie du in diesem Kurs am effizientesten lernst und
          was als Nächstes dran ist.
        </p>
      )}

      {status === 'error' && (
        <p className="mt-2 rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {status === 'ready' && advice && (
        <div className="mt-3">
          {advice.method && (
            <p className="text-sm font-medium">{advice.method}</p>
          )}
          {advice.rationale && (
            <p className="mt-0.5 text-sm text-ink-soft">{advice.rationale}</p>
          )}
          {advice.steps?.length > 0 && (
            <ol className="mt-3 space-y-1.5">
              {advice.steps.map((s, i) => {
                const clickable = Boolean(s.id)
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => clickable && onOpenStep(s.id)}
                      disabled={!clickable}
                      className={`flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left text-sm ${
                        clickable ? 'transition-colors hover:bg-canvas' : 'cursor-default'
                      }`}
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-canvas text-xs font-semibold text-ink-soft">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{s.title}</span>
                        {s.reason && (
                          <span className="block text-xs text-ink-soft">{s.reason}</span>
                        )}
                      </span>
                      {clickable && (
                        <ChevronRight size={15} className="mt-0.5 shrink-0 text-ink-soft" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}
    </section>
  )
}

// Wichtige Links (Moodle/Skript/Kursraum). Hinzufügen/Entfernen speichert
// sofort am Kurs.
function LinksSection({ course, onUpdateCourse }) {
  const links = Array.isArray(course.links) ? course.links : []
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  function add(e) {
    e.preventDefault()
    const l = label.trim()
    const u = url.trim()
    if (!u) return
    const withProto = /^https?:\/\//i.test(u) ? u : `https://${u}`
    onUpdateCourse(course.id, { links: [...links, { label: l || withProto, url: withProto }] })
    setLabel('')
    setUrl('')
  }
  function remove(i) {
    onUpdateCourse(course.id, { links: links.filter((_, idx) => idx !== i) })
  }

  return (
    <section className="mb-8">
      <h3 className="mb-3 text-sm font-semibold text-ink-soft">Wichtige Links</h3>
      {links.length > 0 && (
        <ul className="mb-3 space-y-2">
          {links.map((lnk, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2"
            >
              <a
                href={lnk.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium hover:underline"
              >
                <ExternalLink size={14} className="shrink-0 text-ink-soft" />
                <span className="truncate">{lnk.label}</span>
              </a>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Link ${lnk.label} entfernen`}
                className="grid size-7 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-canvas hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Bezeichnung (z.B. Moodle)"
          className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink/30"
        />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL"
          className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink/30"
        />
        <button
          type="submit"
          disabled={!url.trim()}
          className="inline-flex items-center gap-1 rounded-xl bg-ink px-3 py-2 text-sm font-medium text-canvas transition-opacity disabled:opacity-40"
        >
          <Plus size={15} /> Link
        </button>
      </form>
    </section>
  )
}

// Vorlesungsnotizen als Akkordeon. Jede Vorlesung hat Titel + Text (reiner
// Text). Bearbeiten wird beim Verlassen des Feldes (onBlur) gespeichert,
// damit nicht bei jedem Tastendruck die DB angesprochen wird.
function LecturesSection({ course, onUpdateCourse }) {
  const saved = Array.isArray(course.lectures) ? course.lectures : []
  const [draft, setDraft] = useState(saved)
  const [open, setOpen] = useState(() => new Set())

  // Bei Kurswechsel/externer Änderung den Entwurf nachziehen.
  useEffect(() => {
    setDraft(Array.isArray(course.lectures) ? course.lectures : [])
  }, [course.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function persist(next) {
    setDraft(next)
    onUpdateCourse(course.id, { lectures: next })
  }
  function addLecture() {
    const lec = { id: crypto.randomUUID(), title: `Vorlesung ${draft.length + 1}`, body: '' }
    const next = [...draft, lec]
    setDraft(next)
    setOpen((s) => new Set(s).add(lec.id))
    onUpdateCourse(course.id, { lectures: next })
  }
  function update(id, changes) {
    setDraft((cur) => cur.map((l) => (l.id === id ? { ...l, ...changes } : l)))
  }
  function commit() {
    onUpdateCourse(course.id, { lectures: draft })
  }
  function remove(id) {
    persist(draft.filter((l) => l.id !== id))
  }
  function toggle(id) {
    setOpen((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  return (
    <section className="mb-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-soft">Vorlesungsnotizen</h3>
        <button
          type="button"
          onClick={addLecture}
          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30"
        >
          <Plus size={13} /> Vorlesung
        </button>
      </div>

      {draft.length === 0 ? (
        <EmptyHint icon={Pencil} text="Noch keine Notizen — leg deine erste Vorlesung an." />
      ) : (
        <ul className="space-y-2">
          {draft.map((lec) => {
            const isOpen = open.has(lec.id)
            return (
              <li key={lec.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="flex items-center gap-1 px-2">
                  <button
                    type="button"
                    onClick={() => toggle(lec.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-2 py-3 pl-2 text-left text-sm font-medium"
                  >
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-ink-soft transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                    <span className="truncate">{lec.title || 'Ohne Titel'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(lec.id)}
                    aria-label="Vorlesung entfernen"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-canvas hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {isOpen && (
                  <div className="space-y-2 px-4 pb-4">
                    <input
                      type="text"
                      value={lec.title}
                      onChange={(e) => update(lec.id, { title: e.target.value })}
                      onBlur={commit}
                      placeholder="Titel der Vorlesung"
                      className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-ink/30"
                    />
                    <textarea
                      value={lec.body}
                      onChange={(e) => update(lec.id, { body: e.target.value })}
                      onBlur={commit}
                      placeholder="Notizen zur Vorlesung …"
                      rows={5}
                      className="w-full resize-y rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink/30"
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

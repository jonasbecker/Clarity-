import { useEffect, useMemo, useState } from 'react'
import {
  X,
  Pencil,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ListTodo,
  ArrowUpRight,
} from 'lucide-react'
import TaskCard from './TaskCard.jsx'
import { formatGrade } from '../lib/grades.js'
import { formatDueLabel, isOverdue } from '../lib/date.js'

const TABS = [
  { id: 'inhalt', label: 'Inhalt' },
  { id: 'aufgaben', label: 'Aufgaben' },
  { id: 'termine', label: 'Termine' },
]

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
  onClose,
  onEditMeta,
  onUpdateCourse,
  onToggleTask,
  onDeleteTask,
  onOpenInToday,
}) {
  const [tab, setTab] = useState('inhalt')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const courseTasks = useMemo(
    () => tasks.filter((t) => t.course_id === course.id),
    [tasks, course.id],
  )
  const openTasks = courseTasks.filter((t) => !t.done)
  const dated = courseTasks
    .filter((t) => !t.done && t.due_date)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const color = course.color || 'var(--color-area-study)'

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
          </div>
          <div className="flex shrink-0 items-center gap-1">
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
            <LinksSection course={course} onUpdateCourse={onUpdateCourse} />
            <LecturesSection course={course} onUpdateCourse={onUpdateCourse} />
          </>
        )}

        {tab === 'aufgaben' && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-soft">
                Aufgaben in diesem Kurs
              </h3>
              <button
                type="button"
                onClick={() => onOpenInToday(course.id)}
                className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30"
              >
                In „Heute" öffnen <ArrowUpRight size={13} />
              </button>
            </div>
            {openTasks.length === 0 ? (
              <EmptyHint icon={ListTodo} text="Keine offenen Aufgaben in diesem Kurs." />
            ) : (
              <ul className="space-y-1">
                {openTasks.map((t) => (
                  <li key={t.id}>
                    <TaskCard
                      task={t}
                      onToggle={onToggleTask}
                      onEdit={() => onOpenInToday(course.id)}
                      onDelete={onDeleteTask}
                    />
                  </li>
                ))}
              </ul>
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
    </div>
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

import { useState } from 'react'
import { BookText, ExternalLink, Plus, Trash2, Check, Circle } from 'lucide-react'

// Hausarbeiten-Manager: Recherche-Quellen für Haus-/Abschlussarbeiten.
// Quelle anlegen (Titel, optional Autor/Uni, URL, Kurs), Status zwischen
// „zu lesen" und „gelesen" umschalten, löschen.
export default function Papers({ papers, courses, onAdd, onEdit, onRemove }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [url, setUrl] = useState('')
  const [courseId, setCourseId] = useState('')

  const courseById = new Map(courses.map((c) => [c.id, c]))

  function submit(e) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    const u = url.trim()
    onAdd({
      title: t,
      author: author.trim() || null,
      url: u ? (/^https?:\/\//i.test(u) ? u : `https://${u}`) : null,
      course_id: courseId || null,
      status: 'to_read',
    })
    setTitle('')
    setAuthor('')
    setUrl('')
    setCourseId('')
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-28 pt-6 sm:px-8 sm:pt-10">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          <BookText size={24} />
          Hausarbeiten
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Recherche-Quellen für Haus- und Abschlussarbeiten — sammeln, einem Kurs
          zuordnen und als gelesen markieren.
        </p>
      </header>

      {/* Neue Quelle */}
      <form onSubmit={submit} className="mb-6 rounded-2xl border border-line bg-surface p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel der Quelle"
          className="mb-2 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink/30"
        />
        <div className="mb-2 flex flex-wrap gap-2">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Autor:in / Uni (optional)"
            className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink/30"
          />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (optional)"
            className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink/30"
          >
            <option value="">Kein Kurs</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!title.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas transition-opacity disabled:opacity-40"
          >
            <Plus size={15} /> Quelle
          </button>
        </div>
      </form>

      {papers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
          <BookText size={20} />
          <p>Noch keine Quellen — leg oben deine erste an.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {papers.map((p) => {
            const course = p.course_id ? courseById.get(p.course_id) : null
            const read = p.status === 'read'
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <button
                  type="button"
                  onClick={() => onEdit(p.id, { status: read ? 'to_read' : 'read' })}
                  aria-label={read ? 'Als zu lesen markieren' : 'Als gelesen markieren'}
                  title={read ? 'Gelesen' : 'Zu lesen'}
                  className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                    read ? 'border-ink bg-ink text-canvas' : 'border-line text-ink-soft'
                  }`}
                >
                  {read ? <Check size={13} strokeWidth={3} /> : <Circle size={9} />}
                </button>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-medium ${read ? 'text-ink-soft' : ''}`}>
                    {p.title}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">
                    {[p.author, course?.name, read ? 'gelesen' : 'zu lesen']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Quelle öffnen"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  aria-label={`„${p.title}" löschen`}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-canvas hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

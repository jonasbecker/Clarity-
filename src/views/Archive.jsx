import { Archive as ArchiveIcon, ChevronRight } from 'lucide-react'
import { formatGrade } from '../lib/grades.js'

// Archiv: abgeschlossene/archivierte Kurse. Bleiben mitsamt Notizen und
// Aufgaben lesbar — ein Tipp öffnet wieder die Fach-Detailseite. Aktive Kurse
// erscheinen hier nicht (die liegen im Studium-Hub).
export default function Archive({ courses, tasks, onOpenCourse }) {
  const archived = courses.filter((c) => c.archived)

  // Aufgaben je Kurs zählen (auch erledigte zählen als „Inhalt").
  const countByCourse = new Map()
  for (const t of tasks) {
    if (!t.course_id) continue
    countByCourse.set(t.course_id, (countByCourse.get(t.course_id) || 0) + 1)
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-28 pt-6 sm:px-8 sm:pt-10">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          <ArchiveIcon size={24} />
          Archiv
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Abgeschlossene Kurse — Notizen und Aufgaben bleiben zum Nachschlagen
          erhalten.
        </p>
      </header>

      {archived.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
          <ArchiveIcon size={20} />
          <p>
            Noch nichts archiviert. Über „Semester abschließen" im Studium-Hub
            wandern aktuelle Kurse hierher.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {archived.map((c) => {
            const count = countByCourse.get(c.id) || 0
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onOpenCourse(c.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-ink/30"
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color || 'var(--color-area-study)' }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-ink-soft">
                      {[
                        c.semester,
                        c.ects != null ? `${c.ects} ECTS` : null,
                        `Note ${formatGrade(c.grade)}`,
                        `${count} Aufgabe${count === 1 ? '' : 'n'}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-ink-soft" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

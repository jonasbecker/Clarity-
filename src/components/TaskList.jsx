import SectionTitle from './SectionTitle.jsx'
import TaskGroup from './TaskGroup.jsx'
import CompletedTasks from './CompletedTasks.jsx'
import { areas } from '../data/dummyData.js'

// Liste der Tasks: offene nach Bereich gruppiert, erledigte separat unten
// in einem einklappbaren Bereich.
export default function TaskList({
  tasks,
  loading,
  onToggle,
  onEdit,
  onDelete,
}) {
  // Offene und erledigte trennen.
  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  return (
    <section className="mb-10">
      <SectionTitle aside={loading ? '' : `${open.length} offen`}>
        Offene Tasks
      </SectionTitle>

      {loading ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          Lädt …
        </p>
      ) : tasks.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          Noch keine Tasks. Tipp unten auf „+", um deine erste zu erfassen.
        </p>
      ) : (
        <>
          {open.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
              Alles abgehakt — stark! 🎉
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.keys(areas).map((areaId) => (
                <TaskGroup
                  key={areaId}
                  areaId={areaId}
                  tasks={open.filter((t) => t.area === areaId)}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}

          <CompletedTasks
            tasks={done}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </>
      )}
    </section>
  )
}

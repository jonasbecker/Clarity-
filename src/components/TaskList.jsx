import SectionTitle from './SectionTitle.jsx'
import TaskGroup from './TaskGroup.jsx'
import { areas } from '../data/dummyData.js'

// Liste offener Tasks, gruppiert nach Bereich (Studium / Arbeit / Privat).
// Bekommt jetzt zusätzlich `loading` sowie die Aktionen onToggle/onDelete,
// die bis zur einzelnen TaskCard durchgereicht werden.
export default function TaskList({ tasks, loading, onToggle, onDelete }) {
  return (
    <section className="mb-10">
      <SectionTitle aside={loading ? '' : `${tasks.length} offen`}>
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
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.keys(areas).map((areaId) => (
            <TaskGroup
              key={areaId}
              areaId={areaId}
              tasks={tasks.filter((t) => t.area === areaId)}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}

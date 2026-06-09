import SectionTitle from './SectionTitle.jsx'
import TaskGroup from './TaskGroup.jsx'
import { areas } from '../data/dummyData.js'

// Liste offener Tasks, gruppiert nach Bereich (Studium / Arbeit / Privat).
// Wir filtern die flache Task-Liste pro Bereich heraus. Die Reihenfolge
// ergibt sich aus der Reihenfolge in `areas`.
export default function TaskList({ tasks }) {
  return (
    <section className="mb-10">
      <SectionTitle aside={`${tasks.length} offen`}>
        Offene Tasks
      </SectionTitle>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.keys(areas).map((areaId) => (
          <TaskGroup
            key={areaId}
            areaId={areaId}
            tasks={tasks.filter((t) => t.area === areaId)}
          />
        ))}
      </div>
    </section>
  )
}

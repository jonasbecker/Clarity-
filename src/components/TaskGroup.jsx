import { areas } from '../data/dummyData.js'
import TaskCard from './TaskCard.jsx'

// Eine nach Bereich gruppierte Liste offener Tasks (z.B. alle "Studium").
export default function TaskGroup({ areaId, tasks }) {
  const area = areas[areaId]
  if (tasks.length === 0) return null

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: area.color }}
          aria-hidden="true"
        />
        <h3 className="text-sm font-semibold">{area.label}</h3>
        <span className="text-xs text-ink-soft">{tasks.length}</span>
      </div>
      <div className="divide-y divide-line">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

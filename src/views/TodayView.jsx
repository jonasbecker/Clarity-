import Header from '../components/Header.jsx'
import FocusSection from '../components/FocusSection.jsx'
import Timeline from '../components/Timeline.jsx'
import TaskList from '../components/TaskList.jsx'
import AddTaskButton from '../components/AddTaskButton.jsx'
import { user, focusTasks, timeline, openTasks } from '../data/dummyData.js'

// Die "Heute-View" — die einzige Seite in Phase 1.
// Sie holt die Dummy-Daten und reicht sie an die Komponenten weiter.
// Das ist der "saubere Schnitt": die View kennt die Daten, die kleinen
// Komponenten kennen nur ihre Props.
export default function TodayView() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-28 pt-8 sm:px-8 sm:pt-12">
      <Header name={user.name} />
      <FocusSection tasks={focusTasks} />
      <Timeline events={timeline} />
      <TaskList tasks={openTasks} />
      <AddTaskButton />
    </main>
  )
}

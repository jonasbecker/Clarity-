import { useState } from 'react'
import Header from '../components/Header.jsx'
import FocusSection from '../components/FocusSection.jsx'
import Timeline from '../components/Timeline.jsx'
import TaskList from '../components/TaskList.jsx'
import AddTaskButton from '../components/AddTaskButton.jsx'
import AddTaskModal from '../components/AddTaskModal.jsx'
import { user, focusTasks, timeline, openTasks } from '../data/dummyData.js'

// Die "Heute-View" — die einzige Seite in Phase 1.
//
// Wichtig: die Tasks liegen jetzt in useState (Start: die Dummy-Daten).
// Früher waren sie fest verdrahtet — aber Dinge, die sich ändern können
// (neue Task hinzufügen!), gehören in State. Das nennt man "State nach
// oben heben": er sitzt hier, weil sowohl die Liste als auch das Formular
// ihn brauchen.
export default function TodayView() {
  const [tasks, setTasks] = useState(openTasks)
  const [isModalOpen, setModalOpen] = useState(false)

  // Bekommt die Felder aus dem Formular und legt eine vollständige Task an.
  function handleAddTask({ title, area, due }) {
    const newTask = { id: crypto.randomUUID(), title, area, due }
    // Neue Liste statt Mutation: React erkennt Änderungen an der Identität
    // des Arrays. Die neue Task kommt nach vorne.
    setTasks((prev) => [newTask, ...prev])
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-28 pt-8 sm:px-8 sm:pt-12">
      <Header name={user.name} />
      <FocusSection tasks={focusTasks} />
      <Timeline events={timeline} />
      <TaskList tasks={tasks} />

      <AddTaskButton onClick={() => setModalOpen(true)} />
      <AddTaskModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddTask}
      />
    </main>
  )
}

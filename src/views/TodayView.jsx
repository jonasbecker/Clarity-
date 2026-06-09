import { useState } from 'react'
import Header from '../components/Header.jsx'
import FocusSection from '../components/FocusSection.jsx'
import Timeline from '../components/Timeline.jsx'
import TaskList from '../components/TaskList.jsx'
import AddTaskButton from '../components/AddTaskButton.jsx'
import AddTaskModal from '../components/AddTaskModal.jsx'
import DemoBanner from '../components/DemoBanner.jsx'
import { useTasks } from '../lib/useTasks.js'
import { useGoogleCalendar } from '../lib/useGoogleCalendar.js'
import { selectFocusTasks } from '../lib/focus.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { user, timeline } from '../data/dummyData.js'

// Die "Heute-View".
//
// Tasks kommen aus dem useTasks-Hook (Supabase oder Demo), die Timeline aus
// useGoogleCalendar, und "Fokus heute" wird aus den echten Tasks abgeleitet.
export default function TodayView({ session }) {
  const { tasks, loading, error, addTask, toggleTask, removeTask } =
    useTasks(session)
  const calendar = useGoogleCalendar()
  const [isModalOpen, setModalOpen] = useState(false)

  // Aus allen Tasks die dringendsten 3 für "Fokus heute" wählen.
  const focus = selectFocusTasks(tasks)

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-28 pt-8 sm:px-8 sm:pt-12">
      <Header
        name={user.name}
        onSignOut={
          isSupabaseConfigured ? () => supabase.auth.signOut() : null
        }
      />

      {!isSupabaseConfigured && <DemoBanner />}

      {!loading && <FocusSection tasks={focus} />}
      <Timeline
        status={calendar.status}
        events={calendar.events}
        fallbackEvents={timeline}
        error={calendar.error}
        onConnect={calendar.connect}
      />

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          Fehler beim Laden: {error}
        </p>
      )}

      <TaskList
        tasks={tasks}
        loading={loading}
        onToggle={toggleTask}
        onDelete={removeTask}
      />

      <AddTaskButton onClick={() => setModalOpen(true)} />
      <AddTaskModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addTask}
      />
    </main>
  )
}

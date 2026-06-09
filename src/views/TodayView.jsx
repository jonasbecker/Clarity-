import { useState } from 'react'
import Header from '../components/Header.jsx'
import FocusSection from '../components/FocusSection.jsx'
import Timeline from '../components/Timeline.jsx'
import TaskList from '../components/TaskList.jsx'
import AddTaskButton from '../components/AddTaskButton.jsx'
import TaskModal from '../components/TaskModal.jsx'
import FocusMode from '../components/FocusMode.jsx'
import DemoBanner from '../components/DemoBanner.jsx'
import { useTasks } from '../lib/useTasks.js'
import { useGoogleCalendar } from '../lib/useGoogleCalendar.js'
import { selectFocusTasks } from '../lib/focus.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { user, timeline } from '../data/dummyData.js'

// Die "Heute-View".
//
// Tasks kommen aus useTasks (Supabase oder Demo), die Timeline aus
// useGoogleCalendar, "Fokus heute" wird aus den echten Tasks abgeleitet.
export default function TodayView({ session }) {
  const { tasks, loading, error, addTask, editTask, toggleTask, removeTask } =
    useTasks(session)
  const calendar = useGoogleCalendar()

  // Modal-Zustand: `editing` null = neu, sonst die zu bearbeitende Task.
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [focusOpen, setFocusOpen] = useState(false)

  const focus = selectFocusTasks(tasks)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(task) {
    setEditing(task)
    setModalOpen(true)
  }
  // Speichern: bei vorhandener Task bearbeiten, sonst neu anlegen.
  function handleSubmit(fields) {
    if (editing) editTask(editing.id, fields)
    else addTask(fields)
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-28 pt-8 sm:px-8 sm:pt-12">
      <Header
        name={user.name}
        onSignOut={isSupabaseConfigured ? () => supabase.auth.signOut() : null}
      />

      {!isSupabaseConfigured && <DemoBanner />}

      {!loading && (
        <FocusSection tasks={focus} onStartFocus={() => setFocusOpen(true)} />
      )}

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
        onEdit={openEdit}
        onDelete={removeTask}
      />

      <AddTaskButton onClick={openCreate} />

      <TaskModal
        open={modalOpen}
        task={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={removeTask}
      />

      {focusOpen && (
        <FocusMode
          tasks={focus}
          onToggle={toggleTask}
          onClose={() => setFocusOpen(false)}
        />
      )}
    </main>
  )
}

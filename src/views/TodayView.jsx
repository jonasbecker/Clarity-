import { useState } from 'react'
import Header from '../components/Header.jsx'
import FocusSection from '../components/FocusSection.jsx'
import DayPlan from '../components/DayPlan.jsx'
import TaskList from '../components/TaskList.jsx'
import AddTaskButton from '../components/AddTaskButton.jsx'
import TaskModal from '../components/TaskModal.jsx'
import FocusMode from '../components/FocusMode.jsx'
import DemoBanner from '../components/DemoBanner.jsx'
import ReminderBanner from '../components/ReminderBanner.jsx'
import WeekReview from '../components/WeekReview.jsx'
import Toast from '../components/Toast.jsx'
import { useTasks } from '../lib/useTasks.js'
import { useGoogleCalendar } from '../lib/useGoogleCalendar.js'
import { useAiPlan } from '../lib/useAiPlan.js'
import { useTheme } from '../lib/useTheme.js'
import { useNotifications } from '../lib/useNotifications.js'
import { usePlanPrefs } from '../lib/usePlanPrefs.js'
import { usePlanOrder } from '../lib/usePlanOrder.js'
import { selectFocusTasks } from '../lib/focus.js'
import { weekStats } from '../lib/stats.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { user, timeline } from '../data/dummyData.js'

// Die "Heute-View".
//
// Tasks kommen aus useTasks (Supabase oder Demo), die Timeline aus
// useGoogleCalendar, "Fokus heute" wird aus den echten Tasks abgeleitet.
export default function TodayView({ session }) {
  const {
    tasks,
    loading,
    error,
    addTask,
    editTask,
    toggleTask,
    removeTask,
    pendingDelete,
    undoDelete,
  } = useTasks(session)
  const calendar = useGoogleCalendar()
  const ai = useAiPlan()
  const { theme, toggle: toggleTheme } = useTheme()
  const notifications = useNotifications(tasks, loading)
  const planPrefs = usePlanPrefs()
  const planOrder = usePlanOrder()

  // Modal-Zustand: `editing` null = neu, sonst die zu bearbeitende Task.
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [focusOpen, setFocusOpen] = useState(false)

  // "Fokus heute": KI-Reihenfolge wenn vorhanden, sonst die Heuristik.
  const openTasks = tasks.filter((t) => !t.done)
  const aiFocus =
    ai.status === 'ready' && ai.plan?.focus?.length
      ? ai.plan.focus
          .map((f) => {
            const t = tasks.find((x) => x.id === f.id)
            return t ? { ...t, reason: f.reason } : null
          })
          .filter(Boolean)
      : null
  const focus = aiFocus ?? selectFocusTasks(tasks)
  const stats = weekStats(tasks)

  // Termine für den Tagesplan: echte aus Google, sonst die Beispiel-Timeline.
  const planEvents = calendar.status === 'connected' ? calendar.events : timeline

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
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignOut={isSupabaseConfigured ? () => supabase.auth.signOut() : null}
      />

      {!isSupabaseConfigured && <DemoBanner />}

      <ReminderBanner
        supported={notifications.supported}
        permission={notifications.permission}
        onEnable={notifications.enable}
      />

      {!loading && <WeekReview stats={stats} />}

      {!loading && (
        <FocusSection
          tasks={focus}
          summary={ai.status === 'ready' ? ai.plan?.summary : null}
          aiStatus={ai.status}
          aiError={ai.error}
          onGenerate={() =>
            ai.generate({ tasks: openTasks, events: calendar.events })
          }
          onStartFocus={() => setFocusOpen(true)}
        />
      )}

      {!loading && (
        <DayPlan
          tasks={openTasks}
          events={planEvents}
          calendarStatus={calendar.status}
          onConnect={calendar.connect}
          onToggle={toggleTask}
          prefs={planPrefs}
          ai={ai}
          onOptimize={() =>
            ai.generate({ tasks: openTasks, events: calendar.events })
          }
          planOrder={planOrder}
        />
      )}

      {error && (
        <p className="mb-4 rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
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

      {pendingDelete && (
        <Toast
          message={`„${pendingDelete.task.title}" gelöscht`}
          actionLabel="Rückgängig"
          onAction={undoDelete}
        />
      )}
    </main>
  )
}

import { useRef, useState } from 'react'
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
import QuickAdd from '../components/QuickAdd.jsx'
import Toast from '../components/Toast.jsx'
import Onboarding from '../components/Onboarding.jsx'
import { useTasks } from '../lib/useTasks.js'
import { useGoogleCalendar } from '../lib/useGoogleCalendar.js'
import { useAiPlan } from '../lib/useAiPlan.js'
import { useTheme } from '../lib/useTheme.js'
import { useNotifications } from '../lib/useNotifications.js'
import { usePlanPrefs } from '../lib/usePlanPrefs.js'
import { usePlanOrder } from '../lib/usePlanOrder.js'
import { useTemplates } from '../lib/useTemplates.js'
import { useOnboarding } from '../lib/useOnboarding.js'
import { useKeyboardShortcuts } from '../lib/useKeyboardShortcuts.js'
import { orderedPlanTasks } from '../lib/planTasks.js'
import { buildSchedule } from '../lib/scheduler.js'
import { selectFocusTasks } from '../lib/focus.js'
import { weekStats } from '../lib/stats.js'
import { toISODate } from '../lib/date.js'
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
  const { templates, addTemplate, removeTemplate } = useTemplates(session)
  const onboarding = useOnboarding()

  // Modal-Zustand: `editing` null = neu, sonst die zu bearbeitende Task.
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [focusOpen, setFocusOpen] = useState(false)
  const searchInputRef = useRef(null)

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

  // Termine nach Tag gruppieren (für die Mehrtages-Planung): echte aus Google
  // über mehrere Tage, sonst die Beispiel-Timeline nur für heute.
  const todayISO = toISODate(new Date())

  // Tagesfortschritt: alle für heute fälligen Tasks (offen + heute erledigt).
  const todayTasks = tasks.filter((t) => t.due_date === todayISO)
  const todayProgress = {
    done: todayTasks.filter((t) => t.done).length,
    total: todayTasks.length,
  }

  const eventsByDate =
    calendar.status === 'connected'
      ? calendar.events.reduce((map, e) => {
          ;(map[e.date] ||= []).push(e)
          return map
        }, {})
      : { [todayISO]: timeline }
  const todayEvents = eventsByDate[todayISO] || []

  // Fokus-Modus an den Tagesplan koppeln: die heute noch anstehenden Blöcke
  // in genau der geplanten Reihenfolge durchgehen. Fällt der Plan leer aus
  // (außerhalb der Arbeitszeit o.ä.), nehmen wir die "Fokus heute"-Auswahl.
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const { ordered: orderedPlan } = orderedPlanTasks(
    openTasks,
    ai.plan,
    ai.status,
    planOrder.order,
  )
  const planFocus = buildSchedule({
    tasks: orderedPlan,
    events: todayEvents,
    workStart: planPrefs.workStart,
    workEnd: planPrefs.workEnd,
    now: nowMin,
  })
    .blocks.filter((b) => b.end > nowMin)
    .map((b) => ({ ...b.task, planStart: b.start, planEnd: b.end }))
  const focusQueue = planFocus.length ? planFocus : focus

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(task) {
    setEditing(task)
    setModalOpen(true)
  }

  // Tastatur-Shortcuts (nur wenn weder Modal noch Fokus offen sind).
  useKeyboardShortcuts({
    enabled: !modalOpen && !focusOpen,
    onNew: openCreate,
    onSearch: () => searchInputRef.current?.focus(),
    onFocus: () => focusQueue.length > 0 && setFocusOpen(true),
  })
  // Speichern: bei vorhandener Task bearbeiten, sonst neu anlegen.
  function handleSubmit(fields) {
    if (editing) editTask(editing.id, fields)
    else addTask(fields)
  }
  // Schnell-Hinzufügen aus einer Vorlage: legt sofort eine Task für heute an.
  function quickAdd(template) {
    addTask({
      title: template.title,
      area: template.area,
      duration_min: template.duration_min,
      description: template.description ?? null,
      repeat: template.repeat ?? null,
      due_date: todayISO,
    })
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-28 pt-8 sm:px-8 sm:pt-12">
      <Header
        name={user.name}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignOut={isSupabaseConfigured ? () => supabase.auth.signOut() : null}
        progress={loading ? null : todayProgress}
      />

      {!isSupabaseConfigured && <DemoBanner />}

      <ReminderBanner
        supported={notifications.supported}
        permission={notifications.permission}
        onEnable={notifications.enable}
      />

      {!loading && <WeekReview stats={stats} />}

      <FocusSection
        tasks={focus}
        loading={loading}
        summary={ai.status === 'ready' ? ai.plan?.summary : null}
        aiStatus={ai.status}
        aiError={ai.error}
        onGenerate={() =>
          ai.generate({ tasks: openTasks, events: todayEvents })
        }
        onStartFocus={() => setFocusOpen(true)}
      />

      <DayPlan
        tasks={openTasks}
        loading={loading}
        eventsByDate={eventsByDate}
        calendarStatus={calendar.status}
        onConnect={calendar.connect}
        onToggle={toggleTask}
        prefs={planPrefs}
        ai={ai}
        onOptimize={() =>
          ai.generate({ tasks: openTasks, events: todayEvents })
        }
        planOrder={planOrder}
      />

      {error && (
        <p className="mb-4 rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          Fehler beim Laden: {error}
        </p>
      )}

      {!loading && (
        <QuickAdd templates={templates} onUse={quickAdd} onRemove={removeTemplate} />
      )}

      <TaskList
        tasks={tasks}
        loading={loading}
        onToggle={toggleTask}
        onEdit={openEdit}
        onDelete={removeTask}
        searchInputRef={searchInputRef}
      />

      <AddTaskButton onClick={openCreate} />

      <TaskModal
        open={modalOpen}
        task={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={removeTask}
        onSaveTemplate={addTemplate}
      />

      {focusOpen && (
        <FocusMode
          tasks={focusQueue}
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

      {onboarding.open && <Onboarding onClose={onboarding.dismiss} />}
    </main>
  )
}

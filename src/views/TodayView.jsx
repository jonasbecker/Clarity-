import { useRef, useState } from 'react'
import Header from '../components/Header.jsx'
import DayPlan from '../components/DayPlan.jsx'
import TaskList from '../components/TaskList.jsx'
import AddTaskButton from '../components/AddTaskButton.jsx'
import TaskModal from '../components/TaskModal.jsx'
import CourseModal from '../components/CourseModal.jsx'
import FocusMode from '../components/FocusMode.jsx'
import QuickAdd from '../components/QuickAdd.jsx'
import PullToRefresh from '../components/PullToRefresh.jsx'
import { useGoogleCalendar } from '../lib/useGoogleCalendar.js'
import { useAiPlan } from '../lib/useAiPlan.js'
import { useAiWeek } from '../lib/useAiWeek.js'
import { usePlanOrder } from '../lib/usePlanOrder.js'
import { useTemplates } from '../lib/useTemplates.js'
import { useKeyboardShortcuts } from '../lib/useKeyboardShortcuts.js'
import { usePullToRefresh } from '../lib/usePullToRefresh.js'
import { orderedPlanTasks } from '../lib/planTasks.js'
import { buildSchedule } from '../lib/scheduler.js'
import { selectFocusTasks } from '../lib/focus.js'
import { weekStats } from '../lib/stats.js'
import { toISODate } from '../lib/date.js'
import { user, timeline } from '../data/dummyData.js'

// Die "Heute-View" — Tagesplan, Fokus und die offenen Tasks.
//
// Tasks und Kurse kommen jetzt als Props aus der App-Shell (damit der Hub und
// „Heute" denselben State teilen); die Timeline aus useGoogleCalendar, „Fokus
// heute" wird aus den echten Tasks abgeleitet. `focusArea`/`focusCourse` sind
// Sprünge aus Statistik bzw. Studium-Hub, die die Liste vorfiltern.
export default function TodayView({
  session,
  tasks,
  loading,
  error,
  addTask,
  editTask,
  toggleTask,
  removeTask,
  refresh,
  courses,
  addCourse,
  editCourse,
  removeCourse,
  planPrefs,
  focusArea,
  focusCourse,
}) {
  const calendar = useGoogleCalendar()
  const ai = useAiPlan()
  const aiWeek = useAiWeek()
  const planOrder = usePlanOrder()
  const { templates, addTemplate, removeTemplate } = useTemplates(session)

  // Modal-Zustand: `editing` null = neu, sonst die zu bearbeitende Task.
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [focusOpen, setFocusOpen] = useState(false)
  // Kurs-Modal: `editingCourse` null = neu. `courseFromTask` merkt sich, ob
  // das Kurs-Formular aus dem Task-Formular heraus geöffnet wurde (dann den
  // neuen Kurs dort direkt vorauswählen). `coursePick` trägt id + key.
  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [courseFromTask, setCourseFromTask] = useState(false)
  const [coursePick, setCoursePick] = useState(null)
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

  const todayISO = toISODate(new Date())

  // Tagesfortschritt: alle für heute fälligen Tasks (offen + heute erledigt).
  const todayTasks = tasks.filter((t) => t.due_date === todayISO)
  const todayProgress = {
    done: todayTasks.filter((t) => t.done).length,
    total: todayTasks.length,
  }

  // Pull-to-Refresh (nur sinnvoll, wenn keine Overlays offen sind).
  const pull = usePullToRefresh(refresh, !modalOpen && !focusOpen && !courseModalOpen)

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
  // Heutiges Arbeitszeit-Fenster (oder arbeitsfrei → leerer Plan, dann greift
  // die „Fokus heute"-Auswahl).
  const todayWin = planPrefs.windowForWeekday?.(new Date().getDay()) ?? {
    start: planPrefs.workStart,
    end: planPrefs.workEnd,
  }
  const planFocus = buildSchedule({
    tasks: orderedPlan,
    events: todayEvents,
    workStart: todayWin?.start ?? planPrefs.workStart,
    workEnd: todayWin?.end ?? planPrefs.workEnd,
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

  // Tastatur-Shortcuts (nur wenn weder Task- noch Kurs-/Fokus-Modal offen ist).
  useKeyboardShortcuts({
    enabled: !modalOpen && !focusOpen && !courseModalOpen,
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

  // Kurs-Formular öffnen: `course` null = neu. `fromTask` markiert, dass es
  // aus dem Task-Formular kommt (neuen Kurs danach dort vorauswählen).
  function openCourseModal(course, fromTask = false) {
    setEditingCourse(course)
    setCourseFromTask(fromTask)
    setCourseModalOpen(true)
  }
  // Kurs speichern (neu oder bearbeiten).
  async function handleCourseSubmit(fields) {
    if (editingCourse) {
      editCourse(editingCourse.id, fields)
    } else {
      const created = await addCourse(fields)
      if (created && courseFromTask) {
        setCoursePick({ id: created.id, key: Date.now() })
      }
    }
  }
  // Kurs löschen: zusätzlich die Zuordnung betroffener Tasks lösen, damit die
  // Ansicht sofort stimmt (in Supabase erledigt das die DB serverseitig).
  function handleCourseDelete(id) {
    removeCourse(id)
    tasks
      .filter((t) => t.course_id === id)
      .forEach((t) => editTask(t.id, { course_id: null }))
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-28 pt-2 sm:px-8 sm:pt-4">
      <PullToRefresh
        distance={pull.distance}
        refreshing={pull.refreshing}
        active={pull.active}
      />

      <Header
        name={user.name}
        progress={loading ? null : todayProgress}
        weekly={loading ? null : { total: stats.total, streak: stats.streak }}
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
        aiWeek={aiWeek}
        summary={ai.status === 'ready' ? ai.plan?.summary : null}
        onOptimize={() => ai.generate({ tasks: openTasks, events: todayEvents })}
        onStartFocus={() => focusQueue.length > 0 && setFocusOpen(true)}
        canFocus={focusQueue.length > 0}
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
        focusArea={focusArea}
        courses={courses}
        focusCourse={focusCourse}
      />

      <AddTaskButton onClick={openCreate} />

      <TaskModal
        open={modalOpen}
        task={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={removeTask}
        onSaveTemplate={addTemplate}
        courses={courses}
        tasks={tasks}
        onManageCourse={(course) => openCourseModal(course, true)}
        preselectCourse={coursePick}
      />

      <CourseModal
        open={courseModalOpen}
        course={editingCourse}
        onClose={() => setCourseModalOpen(false)}
        onSubmit={handleCourseSubmit}
        onDelete={handleCourseDelete}
      />

      {focusOpen && (
        <FocusMode
          tasks={focusQueue}
          onToggle={toggleTask}
          onClose={() => setFocusOpen(false)}
        />
      )}
    </main>
  )
}

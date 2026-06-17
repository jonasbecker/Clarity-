import { useRef, useState } from 'react'
import Header from '../components/Header.jsx'
import DayPlan from '../components/DayPlan.jsx'
import TaskList from '../components/TaskList.jsx'
import DoneToday from '../components/DoneToday.jsx'
import AddTaskButton from '../components/AddTaskButton.jsx'
import TaskModal from '../components/TaskModal.jsx'
import CourseModal from '../components/CourseModal.jsx'
import FocusMode from '../components/FocusMode.jsx'
import QuickAdd from '../components/QuickAdd.jsx'
import HoursModal from '../components/HoursModal.jsx'
import PullToRefresh from '../components/PullToRefresh.jsx'
import { Sparkles } from 'lucide-react'
import { useAiPlan } from '../lib/useAiPlan.js'
import { useAiWeek } from '../lib/useAiWeek.js'
import { useDayPlan } from '../lib/useDayPlan.js'
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

// Die „Heute"-Ansicht — der ephemere Tagesplan.
//
// „Heute" zeigt genau die Aufgaben, die bewusst auf den heutigen Tag gezogen
// wurden (`planned_date === heute`) — per Sonne-Knopf an der Aufgabe oder (ab
// Phase 3) per KI-Planung. Der Tagesplan (DayPlan) legt diese Aufgaben als
// Zeitblöcke in die Arbeitsfenster. Darunter steht der gesamte Aufgaben-Pool,
// aus dem man Aufgaben auf „Heute" zieht. Sind alle heutigen Aufgaben erledigt,
// erscheint der Abschluss-Screen. `focusCourse` ist ein Sprung aus dem Hub.
export default function TodayView({
  session,
  tasks,
  loading,
  error,
  addTask,
  editTask,
  toggleTask,
  removeTask,
  planForToday,
  unplanFromToday,
  planManyForToday,
  moveStatus,
  refresh,
  courses,
  addCourse,
  editCourse,
  removeCourse,
  planPrefs,
  focusCourse,
  calendar,
}) {
  const ai = useAiPlan()
  const aiWeek = useAiWeek()
  const dayPlan = useDayPlan()
  const planOrder = usePlanOrder()
  const { templates, addTemplate, removeTemplate } = useTemplates(session)

  // Modal-Zustand: `editing` null = neu, sonst die zu bearbeitende Task.
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [focusOpen, setFocusOpen] = useState(false)
  // Tages-Pop-up: ob das Zeitbudget-Modal offen ist (KI-Planung).
  const [hoursModalOpen, setHoursModalOpen] = useState(false)
  // Kurs-Modal: `editingCourse` null = neu. `courseFromTask` merkt sich, ob
  // das Kurs-Formular aus dem Task-Formular heraus geöffnet wurde (dann den
  // neuen Kurs dort direkt vorauswählen). `coursePick` trägt id + key.
  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [courseFromTask, setCourseFromTask] = useState(false)
  const [coursePick, setCoursePick] = useState(null)
  const searchInputRef = useRef(null)

  const todayISO = toISODate(new Date())

  // Heute eingeplante Aufgaben: offen + heute schon erledigt.
  const plannedAll = tasks.filter((t) => t.planned_date === todayISO)
  const plannedOpen = plannedAll.filter((t) => !t.done)
  const plannedDone = plannedAll.filter((t) => t.done)
  // „Done for the Day": heute war etwas geplant und alles ist abgehakt.
  const dayComplete = plannedAll.length > 0 && plannedOpen.length === 0
  // Heute fokussiert gelernte Zeit (Ist-Zeit, sonst geschätzte Dauer).
  const focusedMin = plannedDone.reduce(
    (sum, t) => sum + (t.actual_min || t.duration_min || 0),
    0,
  )

  // „Fokus heute": KI-Reihenfolge wenn vorhanden, sonst die Heuristik.
  const aiFocus =
    ai.status === 'ready' && ai.plan?.focus?.length
      ? ai.plan.focus
          .map((f) => {
            const t = plannedOpen.find((x) => x.id === f.id)
            return t ? { ...t, reason: f.reason } : null
          })
          .filter(Boolean)
      : null
  const focus = aiFocus ?? selectFocusTasks(plannedOpen)
  const stats = weekStats(tasks)

  // Tagesfortschritt: heute eingeplante Aufgaben (erledigt / gesamt).
  const todayProgress = {
    done: plannedDone.length,
    total: plannedAll.length,
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
    plannedOpen,
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

  // Eine Aufgabe auf „Heute" ziehen oder wieder entfernen (Veto).
  function togglePlan(id) {
    const t = tasks.find((x) => x.id === id)
    if (t?.planned_date === todayISO) unplanFromToday(id)
    else planForToday(id)
  }

  // KI-Planung (Morgen-Call) bzw. „Rette meinen Tag": die KI/Heuristik wählt
  // aus dem Aufgaben-Pool die Aufgaben, die ins Zeitbudget passen, und setzt
  // sie auf „Heute". Überschreibt die offene heutige Auswahl.
  const activeCourses = courses.filter((c) => !c.archived)
  async function runDayPlan(minutes) {
    const pool = tasks.filter((t) => !t.done && t.kind !== 'exam')
    const res = await dayPlan.generate({
      availableMinutes: minutes,
      courses: activeCourses,
      tasks: pool,
    })
    planManyForToday(res.ids)
    setHoursModalOpen(false)
  }

  // Tastatur-Shortcuts (nur wenn weder Task- noch Kurs-/Fokus-Modal offen ist).
  useKeyboardShortcuts({
    enabled: !modalOpen && !focusOpen && !courseModalOpen,
    onNew: openCreate,
    onSearch: () => searchInputRef.current?.focus(),
    onFocus: () => focusQueue.length > 0 && setFocusOpen(true),
  })
  // Speichern: bei vorhandener Task bearbeiten, sonst neu anlegen. Neu im „+"
  // angelegte Aufgaben landen direkt auf dem heutigen Plan.
  function handleSubmit(fields) {
    if (editing) editTask(editing.id, fields)
    else addTask({ ...fields, planned_date: todayISO })
  }
  // Schnell-Hinzufügen aus einer Vorlage: legt sofort eine Aufgabe für heute an.
  function quickAdd(template) {
    addTask({
      title: template.title,
      duration_min: template.duration_min,
      description: template.description ?? null,
      repeat: template.repeat ?? null,
      planned_date: todayISO,
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

  // Pool: alle offenen Aufgaben (zum Einplanen). Leerer Hinweis, wenn heute
  // noch nichts geplant ist, aber Aufgaben im Pool warten.
  const openCount = tasks.filter((t) => !t.done).length
  const showPlanHint = !loading && plannedAll.length === 0 && openCount > 0

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

      {/* Tages-Planung: KI/Heuristik füllt „Heute" anhand deiner Zeit. */}
      {!loading && !dayComplete && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHoursModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform active:scale-95"
          >
            <Sparkles size={15} />
            KI-Planung
          </button>
        </div>
      )}

      {dayComplete ? (
        <DoneToday count={plannedDone.length} minutes={focusedMin} />
      ) : (
        <DayPlan
          tasks={plannedOpen}
          loading={loading}
          eventsByDate={eventsByDate}
          calendarStatus={calendar.status}
          onToggle={toggleTask}
          prefs={planPrefs}
          ai={ai}
          aiWeek={aiWeek}
          onOptimize={() => ai.generate({ tasks: plannedOpen, events: todayEvents })}
          planOrder={planOrder}
        />
      )}

      {error && (
        <p className="mb-4 rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
          Fehler beim Laden: {error}
        </p>
      )}

      {showPlanHint && (
        <p className="mb-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          Noch nichts für heute geplant — tippe bei einer Aufgabe auf ☀, um sie
          auf „Heute" zu ziehen.
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
        courses={courses}
        focusCourse={focusCourse}
        onTogglePlan={togglePlan}
        onSetStatus={moveStatus}
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

      <HoursModal
        open={hoursModalOpen}
        title="Wie viel Zeit hast du heute (noch)?"
        hint="Clarity bündelt deine Aufgaben fokussiert in dieses Zeitbudget."
        confirmLabel="Tag planen"
        loading={dayPlan.status === 'loading'}
        onConfirm={runDayPlan}
        onClose={() => setHoursModalOpen(false)}
      />
    </main>
  )
}

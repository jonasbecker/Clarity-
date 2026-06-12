import { useState } from 'react'
import {
  Archive as ArchiveIcon,
  BookText,
  CalendarDays,
  GraduationCap,
  Timer,
} from 'lucide-react'
import NavBar from '../components/NavBar.jsx'
import StudyHub from './StudyHub.jsx'
import TodayView from './TodayView.jsx'
import LearningEnv from './LearningEnv.jsx'
import Archive from './Archive.jsx'
import Papers from './Papers.jsx'
import CourseDetail from '../components/CourseDetail.jsx'
import CourseModal from '../components/CourseModal.jsx'
import ActualTimeModal from '../components/ActualTimeModal.jsx'
import StatsView from '../components/StatsView.jsx'
import DemoBanner from '../components/DemoBanner.jsx'
import OfflineBanner from '../components/OfflineBanner.jsx'
import ReminderBanner from '../components/ReminderBanner.jsx'
import Onboarding from '../components/Onboarding.jsx'
import Toast from '../components/Toast.jsx'
import { useTasks } from '../lib/useTasks.js'
import { useCourses } from '../lib/useCourses.js'
import { usePapers } from '../lib/usePapers.js'
import { useChores } from '../lib/useChores.js'
import { usePlanPrefs } from '../lib/usePlanPrefs.js'
import { useTheme } from '../lib/useTheme.js'
import { useNotifications } from '../lib/useNotifications.js'
import { useOnboarding } from '../lib/useOnboarding.js'
import { useOnline } from '../lib/useOnline.js'
import { useAppBadge } from '../lib/useAppBadge.js'
import { toISODate, isOverdue } from '../lib/date.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { user } from '../data/dummyData.js'

// Die App-Shell hält die bereichsübergreifend geteilten Daten (Tasks, Kurse,
// Quellen, To-Dos, Theme) an EINER Stelle und reicht sie an die einzelnen
// Bereiche (Studium-Hub, Heute, …) als Props durch. So teilen sich alle
// Ansichten denselben Task-State — Änderungen im Hub und in „Heute" bleiben
// konsistent. Die Navigation läuft ohne Router über einen einfachen
// `view`-State.
//
// Start ist „Heute": beim Öffnen sieht man sofort den Tagesplan und damit
// schnell seine Tagesübersicht. Der Studium-Hub ist einen Tipp entfernt.
export default function AppShell({ session }) {
  const tasksApi = useTasks(session)
  const coursesApi = useCourses(session)
  const papersApi = usePapers(session)
  const choresApi = useChores(session)
  // Arbeitszeit-Einstellungen liegen in der Shell, damit Studium-Hub
  // („Schlau einplanen") und „Heute" (Tagesplan) dieselben Fenster nutzen.
  const planPrefs = usePlanPrefs()
  const { theme, toggle: toggleTheme } = useTheme()
  const notifications = useNotifications(tasksApi.tasks, tasksApi.loading)
  const onboarding = useOnboarding()
  const online = useOnline()

  const [view, setView] = useState('today')
  const [statsOpen, setStatsOpen] = useState(false)
  // Geöffnete Fach-Detailseite (Kurs-id) bzw. Kurs im Bearbeiten-Formular.
  const [detailCourseId, setDetailCourseId] = useState(null)
  const [editingCourse, setEditingCourse] = useState(null)
  // Sprung in die „Heute"-Liste: Kurs-Filter (aus dem Hub). `key` sorgt dafür,
  // dass auch wiederholte Klicks denselben Filter erneut auslösen.
  const [courseJump, setCourseJump] = useState(null)
  // Beim Abhaken einer Lernaufgabe kurz nach der tatsächlichen Dauer fragen
  // (füttert die lernende Schätzung). Hält die gerade erledigte Aufgabe.
  const [timingTask, setTimingTask] = useState(null)

  const detailCourse = detailCourseId
    ? coursesApi.courses.find((c) => c.id === detailCourseId) ?? null
    : null

  // App-Icon-Badge: was heute noch offen oder überfällig ist.
  const todayISO = toISODate(new Date())
  const badgeCount = tasksApi.tasks.filter(
    (t) => !t.done && (t.due_date === todayISO || isOverdue(t.due_date)),
  ).length
  useAppBadge(badgeCount)

  const navItems = [
    { id: 'hub', label: 'Studium', icon: GraduationCap },
    { id: 'today', label: 'Heute', icon: CalendarDays },
    { id: 'env', label: 'Lernen', icon: Timer },
    { id: 'papers', label: 'Hausarbeiten', icon: BookText },
    { id: 'archive', label: 'Archiv', icon: ArchiveIcon },
  ]

  // „Semester abschließen": alle aktuell aktiven Kurse ins Archiv verschieben.
  function endSemester() {
    const active = coursesApi.courses.filter((c) => !c.archived)
    if (active.length === 0) return
    const ok = window.confirm(
      `${active.length} Kurs${active.length === 1 ? '' : 'e'} ins Archiv verschieben? ` +
        'Notizen und Aufgaben bleiben erhalten und sind im Archiv weiter abrufbar.',
    )
    if (!ok) return
    active.forEach((c) => coursesApi.editCourse(c.id, { archived: true }))
  }

  // Abhaken mit Zeiterfassung: schaltet wie gewohnt um und fragt anschließend
  // bei frisch erledigten Lernaufgaben (keine Klausur) nach der tatsächlichen
  // Dauer. Beim Wieder-Öffnen (un-done) kein Dialog.
  function toggleTaskTimed(id) {
    const t = tasksApi.tasks.find((x) => x.id === id)
    const willComplete = t && !t.done
    tasksApi.toggleTask(id)
    if (willComplete && t.kind !== 'exam') {
      setTimingTask(t)
    }
  }

  // Hub-Kachel öffnet die Fach-Detailseite.
  function openCourse(id) {
    setDetailCourseId(id)
  }
  // Aus der Detailseite in die gefilterte „Heute"-Liste springen.
  function openCourseInToday(id) {
    setDetailCourseId(null)
    setCourseJump({ id, key: Date.now() })
    setView('today')
  }
  // Kurs löschen: Detail schließen und die Zuordnung betroffener Tasks lösen
  // (in Supabase erledigt das die DB serverseitig, in der Demo nicht).
  function handleCourseDelete(id) {
    coursesApi.removeCourse(id)
    setDetailCourseId((cur) => (cur === id ? null : cur))
    tasksApi.tasks
      .filter((t) => t.course_id === id)
      .forEach((t) => tasksApi.editTask(t.id, { course_id: null }))
  }

  return (
    <div className="min-h-screen">
      <NavBar
        items={navItems}
        view={view}
        onNavigate={setView}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenStats={() => setStatsOpen(true)}
        onSignOut={isSupabaseConfigured ? () => supabase.auth.signOut() : null}
      />

      <div className="mx-auto w-full max-w-3xl px-5 pt-4 sm:px-8">
        <OfflineBanner online={online} />
        {!isSupabaseConfigured && <DemoBanner />}
        <ReminderBanner
          supported={notifications.supported}
          permission={notifications.permission}
          onEnable={notifications.enable}
        />
      </div>

      {view === 'hub' && (
        <StudyHub
          name={user.name}
          tasks={tasksApi.tasks}
          courses={coursesApi.courses}
          planPrefs={planPrefs}
          onEditTask={tasksApi.editTask}
          onOpenCourse={openCourse}
          onEndSemester={endSemester}
          chores={choresApi.chores}
          onAddChore={choresApi.addChore}
          onToggleChore={(id, done) => choresApi.editChore(id, { done })}
          onRemoveChore={choresApi.removeChore}
        />
      )}

      {view === 'today' && (
        <TodayView
          session={session}
          tasks={tasksApi.tasks}
          loading={tasksApi.loading}
          error={tasksApi.error}
          addTask={tasksApi.addTask}
          editTask={tasksApi.editTask}
          toggleTask={toggleTaskTimed}
          removeTask={tasksApi.removeTask}
          planForToday={tasksApi.planForToday}
          unplanFromToday={tasksApi.unplanFromToday}
          planManyForToday={tasksApi.planManyForToday}
          moveStatus={tasksApi.moveStatus}
          refresh={tasksApi.refresh}
          courses={coursesApi.courses}
          addCourse={coursesApi.addCourse}
          editCourse={coursesApi.editCourse}
          removeCourse={coursesApi.removeCourse}
          planPrefs={planPrefs}
          focusCourse={courseJump}
        />
      )}

      {view === 'env' && (
        <LearningEnv tasks={tasksApi.tasks} onToggle={toggleTaskTimed} />
      )}

      {view === 'archive' && (
        <Archive
          courses={coursesApi.courses}
          tasks={tasksApi.tasks}
          onOpenCourse={openCourse}
        />
      )}

      {view === 'papers' && (
        <Papers
          papers={papersApi.papers}
          courses={coursesApi.courses}
          onAdd={papersApi.addPaper}
          onEdit={papersApi.editPaper}
          onRemove={papersApi.removePaper}
        />
      )}

      {detailCourse && (
        <CourseDetail
          course={detailCourse}
          tasks={tasksApi.tasks}
          courses={coursesApi.courses}
          onClose={() => setDetailCourseId(null)}
          onEditMeta={(course) => setEditingCourse(course)}
          onUpdateCourse={coursesApi.editCourse}
          onAddTask={tasksApi.addTask}
          onEditTask={tasksApi.editTask}
          onToggleTask={toggleTaskTimed}
          onDeleteTask={tasksApi.removeTask}
          onMoveStatus={tasksApi.moveStatus}
          onOpenInToday={openCourseInToday}
        />
      )}

      {editingCourse && (
        <CourseModal
          open
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSubmit={(fields) => coursesApi.editCourse(editingCourse.id, fields)}
          onDelete={handleCourseDelete}
        />
      )}

      {statsOpen && (
        <StatsView tasks={tasksApi.tasks} onClose={() => setStatsOpen(false)} />
      )}

      {timingTask && (
        <ActualTimeModal
          task={timingTask}
          onSave={(actualMin) => {
            tasksApi.editTask(timingTask.id, { actual_min: actualMin })
            setTimingTask(null)
          }}
          onSkip={() => setTimingTask(null)}
        />
      )}

      {tasksApi.pendingDelete && (
        <Toast
          message={`„${tasksApi.pendingDelete.task.title}" gelöscht`}
          actionLabel="Rückgängig"
          onAction={tasksApi.undoDelete}
        />
      )}

      {onboarding.open && <Onboarding onClose={onboarding.dismiss} />}
    </div>
  )
}

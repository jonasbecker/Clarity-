import { useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured } from './supabase.js'
import { fetchTasks, createTask, updateTask, deleteTask } from './tasks.js'
import { nextDueDate } from './repeat.js'
import { toISODate } from './date.js'
import { needsSplit, buildSplitTasks } from './splitTask.js'
import { openTasks as demoTasks } from '../data/dummyData.js'

// Wie lange nach dem Löschen Zeit zum Rückgängigmachen bleibt, bevor die
// Task wirklich aus der Datenbank verschwindet.
const UNDO_DELAY = 5000

// „Clean Slate": offene Aufgaben, die an einem vergangenen Tag auf „Heute"
// gezogen wurden, fallen lautlos zurück in den Kurs-Pool (kein Rollover). Wir
// bereinigen das beim Laden — der Free-Tier hat keinen nächtlichen Cron-Job,
// daher ist ein Lade-Check der einzige kostenlose Weg. Erledigte Aufgaben
// behalten ihr planned_date (für die Tagesbilanz „heute gelernt").
function clearStalePlans(list, todayISO) {
  return list.map((t) =>
    !t.done && t.planned_date && t.planned_date < todayISO
      ? { ...t, planned_date: null }
      : t,
  )
}

// Eigener Hook (custom hook): bündelt die gesamte Task-Logik an einer
// Stelle. Die TodayView ruft `useTasks()` auf und bekommt fertige Daten +
// Aktionen zurück — sie muss nicht wissen, ob im Hintergrund Supabase oder
// der Demo-Modus läuft.
//
// "Optimistisches" Update: bei Klicks ändern wir den State SOFORT (fühlt
// sich schnell an) und schicken die Änderung nebenbei an die Datenbank.
export function useTasks(session) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Gerade gelöschte Task, solange das Rückgängig-Fenster offen ist.
  const [pendingDelete, setPendingDelete] = useState(null)
  const pendingTimeout = useRef(null)

  // Timer aufräumen, wenn die View verschwindet (z.B. beim Abmelden).
  useEffect(() => () => clearTimeout(pendingTimeout.current), [])

  // Tasks laden, wenn sich der Login-Status ändert.
  useEffect(() => {
    let active = true

    const todayISO = toISODate(new Date())

    if (!isSupabaseConfigured) {
      setTasks(
        clearStalePlans(
          demoTasks.map((t) => ({
            priority: 'medium',
            subtasks: [],
            tags: [],
            kind: 'task',
            course_id: null,
            status: 'todo',
            actual_min: null,
            area: 'study',
            planned_date: null,
            ...t,
            done: false,
          })),
          todayISO,
        ),
      )
      setLoading(false)
      return
    }
    if (!session) {
      setTasks([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetchTasks()
      .then(
        (data) =>
          active && (setTasks(clearStalePlans(data, todayISO)), setError(null)),
      )
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))

    // Aufräumen: verhindert State-Updates, falls die Komponente weg ist.
    return () => {
      active = false
    }
  }, [session])

  // Tasks neu vom Server holen (für Pull-to-Refresh). Im Demo-Modus gibt es
  // nichts zu synchronisieren — wir lösen einfach kurz auf.
  async function refresh() {
    if (!isSupabaseConfigured || !session) return
    try {
      const data = await fetchTasks()
      setTasks(clearStalePlans(data, toISODate(new Date())))
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }

  // Neue Aufgabe(n) anlegen. Auto-Split: ist die geschätzte Dauer größer als das
  // harte 120-Minuten-Limit, wird die Aufgabe automatisch in mehrere Teile
  // („… – Teil 1/2/…") zerschnitten.
  async function addTask(fields) {
    const parts = needsSplit(fields.duration_min) ? buildSplitTasks(fields) : [fields]

    if (!isSupabaseConfigured) {
      const rows = parts.map((p) => ({
        id: crypto.randomUUID(),
        done: false,
        priority: 'medium',
        subtasks: [],
        tags: [],
        kind: 'task',
        course_id: null,
        status: 'todo',
        actual_min: null,
        area: 'study',
        planned_date: null,
        ...p,
      }))
      setTasks((prev) => [...rows, ...prev])
      return
    }
    try {
      const created = []
      for (const p of parts) created.push(await createTask(p))
      setTasks((prev) => [...created, ...prev])
    } catch (e) {
      setError(e.message)
    }
  }

  async function toggleTask(id) {
    const target = tasks.find((t) => t.id === id)
    if (!target) return
    const nextDone = !target.done
    const completedAt = nextDone ? new Date().toISOString() : null

    // Sofort umschalten …
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: nextDone, completed_at: completedAt } : t,
      ),
    )

    // Wiederkehrende Task abgehakt → gleich die nächste Instanz anlegen.
    // Priorität und Tags wandern mit; Checklisten-Haken werden zurückgesetzt.
    if (nextDone && target.repeat) {
      addTask({
        title: target.title,
        area: target.area,
        description: target.description,
        due_date: nextDueDate(target.due_date, target.repeat),
        repeat: target.repeat,
        priority: target.priority ?? 'medium',
        tags: target.tags ?? [],
        subtasks: (target.subtasks ?? []).map((s) => ({ ...s, done: false })),
      })
    }

    if (!isSupabaseConfigured) return

    // … und in der DB speichern; bei Fehler zurückrollen.
    try {
      await updateTask(id, { done: nextDone, completed_at: completedAt })
    } catch (e) {
      setError(e.message)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, done: !nextDone, completed_at: target.completed_at ?? null }
            : t,
        ),
      )
    }
  }

  async function editTask(id, changes) {
    const prev = tasks
    // Sofort übernehmen …
    setTasks((cur) =>
      cur.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    )
    if (!isSupabaseConfigured) return

    // … und in der DB speichern; bei Fehler zurückrollen.
    try {
      await updateTask(id, changes)
    } catch (e) {
      setError(e.message)
      setTasks(prev)
    }
  }

  // Kanban: Task in eine Spalte verschieben ('todo' | 'doing' | 'done').
  // `done` bleibt die Quelle der Wahrheit fürs Erledigt-Sein und wird hier
  // mitgeführt (inkl. completed_at für den Wochenrückblick), damit Scheduler
  // und Statistik unverändert weiterlaufen.
  function moveStatus(id, status) {
    const target = tasks.find((t) => t.id === id)
    if (!target) return
    const done = status === 'done'
    const changes = {
      status,
      done,
      completed_at: done
        ? target.completed_at ?? new Date().toISOString()
        : null,
    }
    editTask(id, changes)
  }

  // Eine Aufgabe bewusst auf den heutigen Plan ziehen (planned_date = heute).
  function planForToday(id) {
    editTask(id, { planned_date: toISODate(new Date()) })
  }

  // Manuelles Veto: Aufgabe wieder aus „Heute" entfernen. Sie bleibt offen und
  // wandert zurück in den Kurs-Pool.
  function unplanFromToday(id) {
    editTask(id, { planned_date: null })
  }

  // KI-/Bulk-Auswahl: setzt den heutigen Plan auf genau diese Aufgaben. Bereits
  // erledigte heutige Aufgaben bleiben unberührt (ihre Bilanz zählt weiter);
  // offene, nicht mehr gewählte fallen aus dem Plan.
  function planManyForToday(ids) {
    const todayISO = toISODate(new Date())
    const wanted = new Set(ids)
    tasks.forEach((t) => {
      if (t.done) return
      const planned = t.planned_date === todayISO
      if (wanted.has(t.id) && !planned) editTask(t.id, { planned_date: todayISO })
      else if (!wanted.has(t.id) && planned) editTask(t.id, { planned_date: null })
    })
  }

  // Löscht erst nur visuell — die Task wirklich aus der DB zu entfernen
  // passiert verzögert in `finalizeDelete`, damit `undoDelete` sie in der
  // Zwischenzeit zurückholen kann.
  function removeTask(id) {
    // Falls schon eine Löschung auf Rückgängig wartet: die jetzt abschließen.
    if (pendingDelete) {
      clearTimeout(pendingTimeout.current)
      finalizeDelete(pendingDelete.task.id)
    }

    const index = tasks.findIndex((t) => t.id === id)
    if (index === -1) return
    const task = tasks[index]

    setTasks((cur) => cur.filter((t) => t.id !== id))
    setPendingDelete({ task, index })
    pendingTimeout.current = setTimeout(() => finalizeDelete(id), UNDO_DELAY)
  }

  async function finalizeDelete(id) {
    setPendingDelete((cur) => (cur?.task.id === id ? null : cur))
    if (!isSupabaseConfigured) return

    try {
      await deleteTask(id)
    } catch (e) {
      setError(e.message)
    }
  }

  // Macht eine noch schwebende Löschung rückgängig: Task kommt an ihre
  // ursprüngliche Position zurück, der DB-Löschvorgang wird abgebrochen.
  function undoDelete() {
    if (!pendingDelete) return
    clearTimeout(pendingTimeout.current)
    const { task, index } = pendingDelete
    setTasks((cur) => {
      const next = [...cur]
      next.splice(Math.min(index, next.length), 0, task)
      return next
    })
    setPendingDelete(null)
  }

  return {
    tasks,
    loading,
    error,
    addTask,
    editTask,
    toggleTask,
    moveStatus,
    planForToday,
    unplanFromToday,
    planManyForToday,
    removeTask,
    pendingDelete,
    undoDelete,
    refresh,
  }
}

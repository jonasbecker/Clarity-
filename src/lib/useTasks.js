import { useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured } from './supabase.js'
import { fetchTasks, createTask, updateTask, deleteTask } from './tasks.js'
import { isoInDays, addDaysToISO } from './date.js'
import { openTasks as demoTasks } from '../data/dummyData.js'

// Wie lange nach dem Löschen Zeit zum Rückgängigmachen bleibt, bevor die
// Task wirklich aus der Datenbank verschwindet.
const UNDO_DELAY = 5000

// Nächste Fälligkeit für eine wiederkehrende Task: ein Tag bzw. eine Woche
// nach der bisherigen Fälligkeit — oder ab heute, falls keine gesetzt war.
function nextDueDate(dueDate, repeat) {
  const days = repeat === 'weekly' ? 7 : 1
  return dueDate ? addDaysToISO(dueDate, days) : isoInDays(days)
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

    if (!isSupabaseConfigured) {
      setTasks(demoTasks.map((t) => ({ ...t, done: false })))
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
      .then((data) => active && (setTasks(data), setError(null)))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))

    // Aufräumen: verhindert State-Updates, falls die Komponente weg ist.
    return () => {
      active = false
    }
  }, [session])

  async function addTask(fields) {
    if (!isSupabaseConfigured) {
      setTasks((prev) => [
        { id: crypto.randomUUID(), done: false, ...fields },
        ...prev,
      ])
      return
    }
    try {
      const created = await createTask(fields)
      setTasks((prev) => [created, ...prev])
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
    if (nextDone && target.repeat) {
      addTask({
        title: target.title,
        area: target.area,
        description: target.description,
        due_date: nextDueDate(target.due_date, target.repeat),
        repeat: target.repeat,
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
    removeTask,
    pendingDelete,
    undoDelete,
  }
}

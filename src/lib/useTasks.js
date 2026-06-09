import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from './supabase.js'
import { fetchTasks, createTask, updateTask, deleteTask } from './tasks.js'
import { openTasks as demoTasks } from '../data/dummyData.js'

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

    // Sofort umschalten …
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: nextDone } : t)),
    )
    if (!isSupabaseConfigured) return

    // … und in der DB speichern; bei Fehler zurückrollen.
    try {
      await updateTask(id, { done: nextDone })
    } catch (e) {
      setError(e.message)
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !nextDone } : t)),
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

  async function removeTask(id) {
    const prev = tasks
    setTasks((cur) => cur.filter((t) => t.id !== id))
    if (!isSupabaseConfigured) return

    try {
      await deleteTask(id)
    } catch (e) {
      setError(e.message)
      setTasks(prev) // zurückrollen
    }
  }

  return { tasks, loading, error, addTask, editTask, toggleTask, removeTask }
}

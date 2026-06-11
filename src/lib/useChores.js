import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from './supabase.js'
import { fetchChores, createChore, updateChore, deleteChore } from './chores.js'
import { chores as demoChores } from '../data/dummyData.js'

// Verwaltet die allgemeinen To-Dos (studiumsfremde Checkliste). Gleiche Idee
// wie useCourses: mit Supabase im Konto, ohne Supabase lokal im Browser. Beim
// allerersten Start dienen die Beispiel-To-Dos aus dummyData als Füllung.
const KEY = 'clarity-chores'

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return demoChores
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return demoChores
  }
}

function saveLocal(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // localStorage kann blockiert sein — dann nur für diese Sitzung.
  }
}

export function useChores(session) {
  const [chores, setChores] = useState([])

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      setChores(loadLocal())
      return
    }
    if (!session) {
      setChores([])
      return
    }
    fetchChores()
      .then((data) => active && setChores(data))
      .catch(() => {}) // To-Dos sind ein Extra — Fehler nicht laut machen
    return () => {
      active = false
    }
  }, [session])

  async function addChore(fields) {
    if (!isSupabaseConfigured) {
      const created = { id: crypto.randomUUID(), done: false, ...fields }
      setChores((prev) => {
        const next = [...prev, created]
        saveLocal(next)
        return next
      })
      return created
    }
    try {
      const created = await createChore(fields)
      setChores((prev) => [...prev, created])
      return created
    } catch {
      return null
    }
  }

  async function editChore(id, changes) {
    if (!isSupabaseConfigured) {
      setChores((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...changes } : c))
        saveLocal(next)
        return next
      })
      return
    }
    const prev = chores
    setChores((cur) => cur.map((c) => (c.id === id ? { ...c, ...changes } : c)))
    try {
      await updateChore(id, changes)
    } catch {
      setChores(prev) // zurückrollen
    }
  }

  async function removeChore(id) {
    if (!isSupabaseConfigured) {
      setChores((prev) => {
        const next = prev.filter((c) => c.id !== id)
        saveLocal(next)
        return next
      })
      return
    }
    const prev = chores
    setChores((cur) => cur.filter((c) => c.id !== id))
    try {
      await deleteChore(id)
    } catch {
      setChores(prev) // zurückrollen
    }
  }

  return { chores, addChore, editChore, removeChore }
}

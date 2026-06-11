import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from './supabase.js'
import { fetchPapers, createPaper, updatePaper, deletePaper } from './papers.js'
import { papers as demoPapers } from '../data/dummyData.js'

// Verwaltet die Recherche-Quellen (Hausarbeiten-Manager). Gleiche Idee wie
// useCourses: mit Supabase im Konto, ohne Supabase lokal im Browser. Beim
// allerersten Start dienen die Beispiel-Quellen aus dummyData als Füllung.
const KEY = 'clarity-papers'

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return demoPapers
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return demoPapers
  }
}

function saveLocal(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // localStorage kann blockiert sein — dann nur für diese Sitzung.
  }
}

export function usePapers(session) {
  const [papers, setPapers] = useState([])

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      setPapers(loadLocal())
      return
    }
    if (!session) {
      setPapers([])
      return
    }
    fetchPapers()
      .then((data) => active && setPapers(data))
      .catch(() => {}) // Quellen sind ein Extra — Fehler nicht laut machen
    return () => {
      active = false
    }
  }, [session])

  async function addPaper(fields) {
    if (!isSupabaseConfigured) {
      const created = { id: crypto.randomUUID(), status: 'to_read', ...fields }
      setPapers((prev) => {
        const next = [...prev, created]
        saveLocal(next)
        return next
      })
      return created
    }
    try {
      const created = await createPaper(fields)
      setPapers((prev) => [...prev, created])
      return created
    } catch {
      return null
    }
  }

  async function editPaper(id, changes) {
    if (!isSupabaseConfigured) {
      setPapers((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...changes } : p))
        saveLocal(next)
        return next
      })
      return
    }
    const prev = papers
    setPapers((cur) => cur.map((p) => (p.id === id ? { ...p, ...changes } : p)))
    try {
      await updatePaper(id, changes)
    } catch {
      setPapers(prev) // zurückrollen
    }
  }

  async function removePaper(id) {
    if (!isSupabaseConfigured) {
      setPapers((prev) => {
        const next = prev.filter((p) => p.id !== id)
        saveLocal(next)
        return next
      })
      return
    }
    const prev = papers
    setPapers((cur) => cur.filter((p) => p.id !== id))
    try {
      await deletePaper(id)
    } catch {
      setPapers(prev) // zurückrollen
    }
  }

  return { papers, addPaper, editPaper, removePaper }
}

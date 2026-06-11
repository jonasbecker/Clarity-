import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from './supabase.js'
import { fetchCourses, createCourse, updateCourse, deleteCourse } from './courses.js'
import { courses as demoCourses } from '../data/dummyData.js'

// Verwaltet die Kurse/Module. Gleiche Idee wie useTasks/useTemplates: mit
// Supabase liegen sie im Konto (geräteübergreifend), ohne Supabase lokal im
// Browser (localStorage), damit sie auch im Demo-Modus über das Neuladen
// hinweg erhalten bleiben. Beim allerersten Start (noch nichts gespeichert)
// dienen die Beispiel-Kurse aus dummyData als Erstbefüllung.
const KEY = 'clarity-courses'

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return demoCourses // erste Sitzung: Beispiel-Kurse
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return demoCourses
  }
}

function saveLocal(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // localStorage kann blockiert sein — dann nur für diese Sitzung.
  }
}

export function useCourses(session) {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      setCourses(loadLocal())
      return
    }
    if (!session) {
      setCourses([])
      return
    }
    fetchCourses()
      .then((data) => active && setCourses(data))
      .catch(() => {}) // Kurse sind ein Extra — Fehler nicht laut machen
    return () => {
      active = false
    }
  }, [session])

  // Legt einen Kurs an und gibt ihn (mit id) zurück, damit der Aufrufer ihn
  // z.B. direkt einer Task zuordnen kann.
  async function addCourse(fields) {
    if (!isSupabaseConfigured) {
      const created = { id: crypto.randomUUID(), ...fields }
      setCourses((prev) => {
        const next = [...prev, created]
        saveLocal(next)
        return next
      })
      return created
    }
    try {
      const created = await createCourse(fields)
      setCourses((prev) => [...prev, created])
      return created
    } catch {
      return null
    }
  }

  async function editCourse(id, changes) {
    if (!isSupabaseConfigured) {
      setCourses((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...changes } : c))
        saveLocal(next)
        return next
      })
      return
    }
    const prev = courses
    setCourses((cur) => cur.map((c) => (c.id === id ? { ...c, ...changes } : c)))
    try {
      await updateCourse(id, changes)
    } catch {
      setCourses(prev) // zurückrollen
    }
  }

  async function removeCourse(id) {
    if (!isSupabaseConfigured) {
      setCourses((prev) => {
        const next = prev.filter((c) => c.id !== id)
        saveLocal(next)
        return next
      })
      return
    }
    const prev = courses
    setCourses((cur) => cur.filter((c) => c.id !== id))
    try {
      await deleteCourse(id)
    } catch {
      setCourses(prev) // zurückrollen
    }
  }

  return { courses, addCourse, editCourse, removeCourse }
}

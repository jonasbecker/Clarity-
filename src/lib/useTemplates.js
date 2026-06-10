import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from './supabase.js'
import { fetchTemplates, createTemplate, deleteTemplate } from './templates.js'

// Verwaltet die Vorlagen. Gleiche Idee wie useTasks: mit Supabase liegen sie
// im Konto (geräteübergreifend), ohne Supabase lokal im Browser (localStorage),
// damit sie auch im Demo-Modus über das Neuladen hinweg erhalten bleiben.
const KEY = 'clarity-templates'

function loadLocal() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function saveLocal(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // localStorage kann blockiert sein — dann nur für diese Sitzung.
  }
}

export function useTemplates(session) {
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      setTemplates(loadLocal())
      return
    }
    if (!session) {
      setTemplates([])
      return
    }
    fetchTemplates()
      .then((data) => active && setTemplates(data))
      .catch(() => {}) // Vorlagen sind ein Extra — Fehler nicht laut machen
    return () => {
      active = false
    }
  }, [session])

  async function addTemplate(fields) {
    // Keine Dubletten anlegen (gleicher Titel + Bereich).
    const exists = templates.some(
      (t) =>
        t.title.trim().toLowerCase() === fields.title.trim().toLowerCase() &&
        t.area === fields.area,
    )
    if (exists) return

    if (!isSupabaseConfigured) {
      setTemplates((prev) => {
        const next = [...prev, { id: crypto.randomUUID(), ...fields }]
        saveLocal(next)
        return next
      })
      return
    }
    try {
      const created = await createTemplate(fields)
      setTemplates((prev) => [...prev, created])
    } catch {
      // still ignorieren
    }
  }

  async function removeTemplate(id) {
    if (!isSupabaseConfigured) {
      setTemplates((prev) => {
        const next = prev.filter((t) => t.id !== id)
        saveLocal(next)
        return next
      })
      return
    }
    const prev = templates
    setTemplates((cur) => cur.filter((t) => t.id !== id))
    try {
      await deleteTemplate(id)
    } catch {
      setTemplates(prev) // zurückrollen
    }
  }

  return { templates, addTemplate, removeTemplate }
}

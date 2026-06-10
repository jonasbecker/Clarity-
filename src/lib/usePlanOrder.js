import { useState } from 'react'
import { toISODate } from './date.js'

// Merkt sich eine manuell festgelegte Reihenfolge der Tasks im Tagesplan —
// als Liste von Task-ids in localStorage, pro Tag. Reorder per Drag oder
// Hoch/Runter überschreibt damit die automatische (KI-/Heuristik-)Reihenfolge.
// Bei einem neuen Tag (oder "Auto"-Reset) ist sie wieder leer.
const KEY = 'clarity-plan-order'

function today() {
  return toISODate(new Date())
}

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    if (v?.date === today() && Array.isArray(v.order)) return v.order
  } catch {
    // kaputter Wert → keine manuelle Reihenfolge
  }
  return null
}

export function usePlanOrder() {
  const [order, setOrderState] = useState(load)

  function setOrder(next) {
    setOrderState(next)
    try {
      localStorage.setItem(KEY, JSON.stringify({ date: today(), order: next }))
    } catch {
      // localStorage kann blockiert sein — dann nur für diese Sitzung.
    }
  }

  function reset() {
    setOrderState(null)
    try {
      localStorage.removeItem(KEY)
    } catch {
      // egal
    }
  }

  return { order, setOrder, reset }
}

// Sortiert Tasks nach der manuellen id-Reihenfolge. Bekannte zuerst (in
// manueller Reihenfolge), unbekannte/neue Tasks hängen in ihrer bisherigen
// Reihenfolge hinten an.
export function applyOrder(tasks, order) {
  if (!order) return tasks
  const rank = new Map(order.map((id, i) => [id, i]))
  return tasks
    .slice()
    .sort((a, b) => {
      const ra = rank.has(a.id) ? rank.get(a.id) : Infinity
      const rb = rank.has(b.id) ? rank.get(b.id) : Infinity
      return ra - rb
    })
}

// Vertauscht eine Task mit ihrer Nachbarin (Hoch/Runter).
export function moveInOrder(ids, id, dir) {
  const i = ids.indexOf(id)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= ids.length) return ids
  const next = ids.slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

// Verschiebt `fromId` direkt vor `toId` (für Drag & Drop).
export function reorderTo(ids, fromId, toId) {
  if (fromId === toId) return ids
  const next = ids.filter((x) => x !== fromId)
  const idx = next.indexOf(toId)
  if (idx < 0) return ids
  next.splice(idx, 0, fromId)
  return next
}

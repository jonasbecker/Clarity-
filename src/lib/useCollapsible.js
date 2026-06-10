import { useEffect, useState } from 'react'

// Merkt sich, welche Abschnitte ein-/ausgeklappt sind (z.B. "Dein Fokus
// heute", "Tagesplan") — als Map { [sectionId]: boolean } in localStorage.
const KEY = 'clarity-collapsed'

function loadAll() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

export function useCollapsible(id, defaultOpen = true) {
  const [open, setOpen] = useState(() => {
    const saved = loadAll()[id]
    return typeof saved === 'boolean' ? saved : defaultOpen
  })

  useEffect(() => {
    try {
      const all = loadAll()
      all[id] = open
      localStorage.setItem(KEY, JSON.stringify(all))
    } catch {
      // localStorage kann blockiert sein — dann nur für diese Sitzung.
    }
  }, [id, open])

  const toggle = () => setOpen((o) => !o)

  return { open, toggle }
}

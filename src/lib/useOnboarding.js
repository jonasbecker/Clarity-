import { useState } from 'react'

// Kurze Einführung beim allerersten Start. Wer schon vorher etwas in Clarity
// gespeichert hat (Theme, Arbeitszeiten, Vorlagen, eigene Reihenfolge …),
// kennt die App bereits und bekommt sie nicht mehr angezeigt.
const KEY = 'clarity-onboarding-done'
const KNOWN_USER_KEYS = [
  'clarity-theme',
  'clarity-plan-prefs',
  'clarity-plan-order',
  'clarity-templates',
]

function alreadyKnown() {
  try {
    if (localStorage.getItem(KEY)) return true
    return KNOWN_USER_KEYS.some((k) => localStorage.getItem(k) !== null)
  } catch {
    return true // localStorage blockiert → lieber nicht stören
  }
}

export function useOnboarding() {
  const [open, setOpen] = useState(() => !alreadyKnown())

  function dismiss() {
    setOpen(false)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // localStorage kann blockiert sein — dann nur für diese Sitzung.
    }
  }

  return { open, dismiss }
}

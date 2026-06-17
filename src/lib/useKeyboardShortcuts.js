import { useEffect } from 'react'

// Globale Tastatur-Shortcuts. Bewusst schlicht gehalten:
//   n → neue Task erfassen
//   f → Fokus-Modus starten
// Greift NICHT, während ein Eingabefeld (input/textarea/select/contenteditable)
// den Fokus hat oder wenn `enabled` false ist (z.B. Modal/Fokus schon offen).
export function useKeyboardShortcuts({ enabled, onNew, onFocus }) {
  useEffect(() => {
    if (!enabled) return

    const onKey = (e) => {
      // Modifier-Tasten (Strg/Cmd/Alt) lassen wir dem Browser/OS.
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const el = e.target
      const tag = el?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el?.isContentEditable
      )
        return

      if (e.key === 'n') {
        e.preventDefault()
        onNew?.()
      } else if (e.key === 'f') {
        e.preventDefault()
        onFocus?.()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, onNew, onFocus])
}

import { useEffect } from 'react'

// Setzt das App-Icon-Badge (Badging API) auf die Anzahl heute anstehender
// bzw. überfälliger Tasks. So sieht man schon am Homescreen-Icon, wie viel
// noch offen ist. Wird nicht überall unterstützt (v.a. installierte PWAs) —
// sonst ist es ein No-op.
export function useAppBadge(count) {
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    try {
      if (count > 0 && navigator.setAppBadge) {
        navigator.setAppBadge(count)
      } else if (navigator.clearAppBadge) {
        navigator.clearAppBadge()
      }
    } catch {
      // Badging nicht verfügbar — bewusst ignorieren.
    }
  }, [count])
}

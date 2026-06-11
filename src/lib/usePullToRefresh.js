import { useEffect, useRef, useState } from 'react'

// Pull-to-Refresh für die installierte PWA: Im Standalone-Modus gibt es kein
// natives „nach unten ziehen zum Aktualisieren", also bauen wir es selbst.
// Wird nur ausgelöst, wenn die Seite ganz oben steht und weit genug gezogen
// wird. `onRefresh` darf ein Promise zurückgeben (Spinner läuft solange).
const THRESHOLD = 70 // Pixel, ab denen ausgelöst wird
const MAX = 110 // maximaler sichtbarer Zug (gedämpft)

export function usePullToRefresh(onRefresh, enabled = true) {
  const [distance, setDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(null)

  useEffect(() => {
    if (!enabled) return

    function onStart(e) {
      if (window.scrollY > 0 || refreshing) {
        startY.current = null
        return
      }
      startY.current = e.touches[0].clientY
    }

    function onMove(e) {
      if (startY.current == null || refreshing) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) {
        setDistance(0)
        return
      }
      // Gedämpfter Zug: fühlt sich „elastisch" an und übersteigt MAX nie.
      setDistance(Math.min(MAX, dy * 0.5))
    }

    function onEnd() {
      if (startY.current == null) return
      startY.current = null
      if (distance >= THRESHOLD && !refreshing) {
        setRefreshing(true)
        setDistance(THRESHOLD)
        Promise.resolve(onRefresh?.()).finally(() => {
          setRefreshing(false)
          setDistance(0)
        })
      } else {
        setDistance(0)
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [enabled, distance, refreshing, onRefresh])

  return { distance, refreshing, active: distance >= THRESHOLD }
}

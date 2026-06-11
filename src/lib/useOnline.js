import { useEffect, useState } from 'react'

// Verfolgt, ob das Gerät online ist. Dank Service Worker lädt die App auch
// offline; ein kleiner Hinweis macht nur transparent, dass Änderungen evtl.
// noch nicht synchronisiert sind.
export function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return online
}

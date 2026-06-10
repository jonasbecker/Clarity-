import { useEffect, useState } from 'react'
import { toISODate, daysUntil } from './date.js'

// An welchem Tag zuletzt erinnert wurde — höchstens einmal pro Tag.
const KEY = 'clarity-notified-date'

// Erinnert beim Öffnen der App an heute fällige/überfällige Tasks —
// per Browser-Benachrichtigung, gratis und ohne Server. Höchstens einmal
// pro Tag, und nur wenn die Erlaubnis erteilt wurde.
export function useNotifications(tasks, loading) {
  const supported = typeof window !== 'undefined' && 'Notification' in window
  const [permission, setPermission] = useState(
    supported ? Notification.permission : 'unsupported',
  )

  async function enable() {
    if (!supported) return
    setPermission(await Notification.requestPermission())
  }

  useEffect(() => {
    if (!supported || permission !== 'granted' || loading) return

    const today = toISODate(new Date())
    if (localStorage.getItem(KEY) === today) return

    const due = tasks.filter((t) => {
      if (t.done || !t.due_date) return false
      return daysUntil(t.due_date) <= 0
    })
    if (due.length === 0) return

    const overdue = due.filter((t) => daysUntil(t.due_date) < 0).length
    const body =
      overdue > 0
        ? `${due.length} Tasks fällig (davon ${overdue} überfällig).`
        : `${due.length} Task${due.length > 1 ? 's' : ''} für heute fällig.`

    notify('Clarity', body)
    try {
      localStorage.setItem(KEY, today)
    } catch {
      // localStorage kann blockiert sein — dann erinnert die App eben
      // jedes Mal neu, statt nur einmal pro Tag.
    }
  }, [supported, permission, loading, tasks])

  return { supported, permission, enable }
}

// Zeigt die Benachrichtigung über den Service Worker (funktioniert auch als
// installierte PWA), mit Fallback auf die direkte Notification-API (z.B. im
// Dev-Server, wo kein Service Worker läuft).
async function notify(title, body) {
  const options = { body, icon: '/pwa-192.png', tag: 'clarity-due' }
  try {
    const reg = 'serviceWorker' in navigator
      ? await navigator.serviceWorker.getRegistration()
      : null
    if (reg) reg.showNotification(title, options)
    else new Notification(title, options)
  } catch {
    // Benachrichtigungen sind ein Nice-to-have — Fehler einfach ignorieren.
  }
}

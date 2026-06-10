import { useState } from 'react'
import { Bell, X } from 'lucide-react'

// Wenn der Hinweis weggeklickt wurde, nicht erneut anzeigen.
const DISMISS_KEY = 'clarity-notif-dismissed'

// Bietet an, Erinnerungen für fällige Tasks zu aktivieren (Browser-
// Benachrichtigungen). Verschwindet nach Erlaubnis/Ablehnung oder Klick auf
// "Schließen" dauerhaft.
export default function ReminderBanner({ supported, permission, onEnable }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  )

  if (!supported || permission !== 'default' || dismissed) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // localStorage kann blockiert sein — dann nur für diese Sitzung weg.
    }
  }

  return (
    <div className="mb-8 flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
      <Bell size={16} className="mt-0.5 shrink-0 text-area-study" />
      <p className="flex-1 text-ink-soft">
        <span className="font-medium text-ink">Erinnerungen?</span> Clarity
        kann dich beim Öffnen an fällige Tasks erinnern.
      </p>
      <button
        type="button"
        onClick={onEnable}
        className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium transition-colors hover:border-ink/30"
      >
        Aktivieren
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hinweis schließen"
        className="shrink-0 text-ink-soft transition-colors hover:text-ink"
      >
        <X size={15} />
      </button>
    </div>
  )
}

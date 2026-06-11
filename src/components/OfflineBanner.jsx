import { WifiOff } from 'lucide-react'

// Dezenter Hinweis, wenn das Gerät offline ist. Die App funktioniert dank
// Service Worker weiter; mit Supabase werden Änderungen synchronisiert,
// sobald die Verbindung zurück ist.
export default function OfflineBanner({ online }) {
  if (online) return null
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink-soft">
      <WifiOff size={16} className="shrink-0" />
      Offline — Änderungen werden synchronisiert, sobald du wieder verbunden bist.
    </div>
  )
}

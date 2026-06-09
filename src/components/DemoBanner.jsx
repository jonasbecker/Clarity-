import { Info } from 'lucide-react'

// Kleiner Hinweis, solange keine Supabase-Schlüssel hinterlegt sind.
// Dann läuft alles lokal und Tasks werden beim Neuladen nicht gespeichert.
export default function DemoBanner() {
  return (
    <div className="mb-8 flex items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
      <Info size={16} className="mt-0.5 shrink-0 text-area-work" />
      <p>
        <span className="font-medium text-ink">Demo-Modus.</span> Noch nicht
        mit Supabase verbunden — neue Tasks werden beim Neuladen nicht
        gespeichert. Setup-Schritte stehen in der README.
      </p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'

// Mobil-first Bottom-Sheet für die beiden Tages-Pop-ups: „Wie viele Stunden
// hast du heute?" (Morgen-Call) bzw. „Wie viel Zeit hast du noch?" („Rette
// meinen Tag"). Liefert die gewählte Zeit in MINUTEN an `onConfirm`.
const PRESETS = [1, 2, 3, 4, 6] // Stunden-Schnellwahl

export default function HoursModal({
  open,
  title,
  hint,
  confirmLabel = 'Planen',
  loading = false,
  onConfirm,
  onClose,
}) {
  const [hours, setHours] = useState(2)

  useEffect(() => {
    if (open) setHours(2)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const minutes = Math.round(Number(hours) * 60)
  const canConfirm = minutes > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl bg-surface p-6 shadow-xl sm:max-w-sm sm:rounded-3xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-canvas"
          >
            <X size={18} />
          </button>
        </div>
        {hint && <p className="mb-4 text-sm text-ink-soft">{hint}</p>}

        {/* Stunden-Schnellwahl */}
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((h) => {
            const active = Number(hours) === h
            return (
              <button
                key={h}
                type="button"
                onClick={() => setHours(h)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line text-ink-soft hover:border-ink/30'
                }`}
              >
                {h} Std
              </button>
            )
          })}
        </div>

        {/* Feinjustierung */}
        <div className="mb-5 flex items-center gap-2">
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(Math.max(0, Number(e.target.value) || 0))}
            aria-label="Stunden"
            className="w-24 rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink/30"
          />
          <span className="text-sm text-ink-soft">Stunden ({minutes} Min)</span>
        </div>

        <button
          type="button"
          disabled={!canConfirm || loading}
          onClick={() => onConfirm(minutes)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 font-medium text-canvas transition-opacity disabled:opacity-40"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Plane …' : confirmLabel}
        </button>
      </div>
    </div>
  )
}

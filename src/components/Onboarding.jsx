import { useState } from 'react'
import { Sparkles, CalendarClock, Target, Repeat, Rocket } from 'lucide-react'

// Vier kurze Schritte, die die wichtigsten Funktionen zeigen — überspringbar.
const STEPS = [
  {
    icon: Sparkles,
    title: 'Willkommen bei Clarity',
    text: 'Dein persönliches Command Center für den Tag — Tasks, Kalender und KI-Planung an einem Ort.',
  },
  {
    icon: CalendarClock,
    title: 'KI-Tagesplan',
    text: 'Clarity plant deine offenen Tasks automatisch in die Lücken zwischen deinen Terminen. „Mit KI optimieren" verfeinert Reihenfolge und Dauer.',
  },
  {
    icon: Target,
    title: 'Fokus-Modus',
    text: 'Geh deine Tasks in der geplanten Reihenfolge durch — eine nach der anderen, ganz ohne Ablenkung.',
  },
  {
    icon: Repeat,
    title: 'Schnell hinzufügen',
    text: 'Routine-Tasks beim Anlegen als Vorlage merken und danach mit einem Tipp für heute neu erstellen.',
  },
  {
    icon: Rocket,
    title: 'Los geht’s',
    text: 'Leg direkt los — über den Knopf unten rechts erfasst du deine erste Task.',
  },
]

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1
  const { icon: Icon, title, text } = STEPS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Einführung"
        className="w-full rounded-t-3xl bg-surface p-6 text-center shadow-xl sm:max-w-sm sm:rounded-3xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-canvas text-ink">
          <Icon size={26} />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-ink-soft">{text}</p>

        {/* Fortschritt */}
        <div className="mt-5 flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? '1.25rem' : '0.375rem',
                backgroundColor: i === step ? 'var(--color-ink)' : 'var(--color-line)',
              }}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          {!last && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-line py-3 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              Überspringen
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? onClose() : setStep((s) => s + 1))}
            className="flex-1 rounded-xl bg-ink py-3 text-sm font-medium text-canvas"
          >
            {last ? 'Los geht’s' : 'Weiter'}
          </button>
        </div>
      </div>
    </div>
  )
}

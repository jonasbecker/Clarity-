import { Play, Pause, RotateCcw, SkipForward, Volume2 } from 'lucide-react'
import { usePomodoro } from '../lib/usePomodoro.js'
import { useAmbientSound } from '../lib/useAmbientSound.js'
import TaskCard from '../components/TaskCard.jsx'
import { toISODate, isOverdue } from '../lib/date.js'

// Voreinstellungen Fokus/Pause (Minuten).
const TIMER_PRESETS = [
  { work: 25, brk: 5, label: '25 / 5' },
  { work: 50, brk: 10, label: '50 / 10' },
]

function mmss(total) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Beim Phasenwechsel eine kurze Benachrichtigung — nur wenn erlaubt.
function notifyPhase(phase) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(phase === 'work' ? 'Weiter geht’s — Fokuszeit' : 'Pause — kurz durchatmen')
    }
  } catch {
    // ignore
  }
}

// Die Lernumgebung: ablenkungsfreie Seite mit Pomodoro-Timer, Ambient-Sounds
// (Web Audio) und nur den heute fälligen Lernaufgaben/Klausuren.
export default function LearningEnv({ tasks, onToggle }) {
  const pomo = usePomodoro({ onPhaseEnd: notifyPhase })
  const sound = useAmbientSound()

  const todayISO = toISODate(new Date())
  const due = tasks.filter(
    (t) =>
      !t.done &&
      t.area === 'study' &&
      (t.due_date === todayISO || isOverdue(t.due_date)),
  )

  const total = (pomo.phase === 'work' ? pomo.workMin : pomo.breakMin) * 60
  const pct = total > 0 ? Math.round(((total - pomo.seconds) / total) * 100) : 0

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-28 pt-6 sm:px-8 sm:pt-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Lernumgebung</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Fokussiert arbeiten — Timer, ruhige Klänge und nur das, was heute zählt.
        </p>
      </header>

      {/* Pomodoro */}
      <section className="mb-6 rounded-3xl border border-line bg-surface p-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">
          {pomo.phase === 'work' ? 'Fokuszeit' : 'Pause'}
        </p>
        <p className="my-2 font-mono text-6xl font-semibold tabular-nums tracking-tight">
          {mmss(pomo.seconds)}
        </p>
        <div className="mx-auto mb-5 h-1.5 max-w-xs overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex items-center justify-center gap-2">
          {pomo.running ? (
            <button
              type="button"
              onClick={pomo.pause}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-canvas"
            >
              <Pause size={16} /> Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={pomo.start}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-canvas"
            >
              <Play size={16} /> Start
            </button>
          )}
          <button
            type="button"
            onClick={pomo.skip}
            aria-label="Phase überspringen"
            className="grid size-10 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-ink/30"
          >
            <SkipForward size={16} />
          </button>
          <button
            type="button"
            onClick={pomo.reset}
            aria-label="Zurücksetzen"
            className="grid size-10 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-ink/30"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          {TIMER_PRESETS.map((p) => {
            const active = pomo.workMin === p.work && pomo.breakMin === p.brk
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => pomo.setDurations(p.work, p.brk)}
                aria-pressed={active}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active ? 'bg-ink text-canvas' : 'text-ink-soft hover:bg-canvas'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Ambient-Sounds */}
      <section className="mb-6 rounded-2xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-soft">Hintergrundklang</h2>
        <div className="flex flex-wrap gap-2">
          {sound.presets.map((p) => {
            const active = sound.preset === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => sound.setPreset(p.id)}
                aria-pressed={active}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-ink text-canvas' : 'text-ink-soft hover:bg-canvas'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        {sound.preset !== 'off' && (
          <div className="mt-4 flex items-center gap-3">
            <Volume2 size={16} className="shrink-0 text-ink-soft" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sound.volume}
              onChange={(e) => sound.setVolume(Number(e.target.value))}
              aria-label="Lautstärke"
              className="h-1.5 w-full accent-ink"
            />
          </div>
        )}
      </section>

      {/* Heute fällige Lernaufgaben */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-soft">Heute dran</h2>
        {due.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
            Nichts Fälliges fürs Studium heute — gönn dir den Fokus für Vorarbeit.
          </div>
        ) : (
          <ul className="rounded-2xl border border-line bg-surface px-4 py-1">
            {due.map((t) => (
              <li key={t.id}>
                <TaskCard task={t} onToggle={onToggle} onEdit={() => {}} onDelete={() => {}} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

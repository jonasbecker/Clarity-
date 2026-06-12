import { useEffect, useState } from 'react'
import { X, Trophy, Flame, Clock, BarChart3, Gauge } from 'lucide-react'
import { productivityStats } from '../lib/productivity.js'
import { weekStats } from '../lib/stats.js'
import BarChart from './BarChart.jsx'

// Wählbare Zeitfenster für die Auswertung.
const RANGES = [
  { weeks: 4, label: '4 Wochen' },
  { weeks: 12, label: '12 Wochen' },
  { weeks: 26, label: '26 Wochen' },
]

// Vollbild-Statistik: Mustererkennung aus erledigten Tasks (`completed_at`).
// Folgt dem Overlay-Muster aus FocusMode (Escape schließt, Hintergrund
// gesperrt).
export default function StatsView({ tasks, onClose }) {
  const [weeks, setWeeks] = useState(12)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const stats = productivityStats(tasks, weeks)
  const week = weekStats(tasks)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas">
      <div className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Statistik</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Statistik schließen"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface"
          >
            <X size={20} />
          </button>
        </div>

        {/* Zeitraum-Umschalter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {RANGES.map((r) => {
            const active = weeks === r.weeks
            return (
              <button
                key={r.weeks}
                type="button"
                onClick={() => setWeeks(r.weeks)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line text-ink-soft hover:border-ink/30'
                }`}
              >
                {r.label}
              </button>
            )
          })}
        </div>

        {stats.total === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
            <BarChart3 size={20} />
            <p>Noch keine Muster — hak ein paar Tasks ab, dann siehst du hier deine Statistik.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard icon={Trophy} label="Insgesamt erledigt" value={stats.total} />
              <MetricCard icon={Gauge} label="Ø pro Woche" value={stats.avgPerWeek} />
              <MetricCard icon={Flame} label="Aktuelle Serie" value={`${week.streak} Tage`} />
              <MetricCard icon={Clock} label="Beste Zeit" value={stats.bestTimeOfDay ?? '–'} />
            </div>

            <section className="mb-8">
              <h3 className="mb-3 text-sm font-semibold text-ink-soft">Produktivste Tageszeit</h3>
              <BarChart data={stats.byTimeOfDay} />
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-sm font-semibold text-ink-soft">Nach Wochentag</h3>
              <BarChart data={stats.byWeekday} orientation="vertical" />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-ink-soft">
                Trend ({stats.weeks} Wochen)
              </h3>
              <BarChart data={stats.weeklyTrend} orientation="vertical" />
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <Icon size={16} className="text-ink-soft" />
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  )
}

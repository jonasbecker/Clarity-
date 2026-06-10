import { useEffect } from 'react'
import { X, Trophy, Flame, Clock, CalendarDays, BarChart3 } from 'lucide-react'
import { areas } from '../data/dummyData.js'
import { productivityStats } from '../lib/productivity.js'
import { weekStats } from '../lib/stats.js'
import BarChart from './BarChart.jsx'

// Vollbild-Statistik: Mustererkennung aus erledigten Tasks (`completed_at`).
// Folgt dem Overlay-Muster aus FocusMode (Escape schließt, Hintergrund
// gesperrt).
export default function StatsView({ tasks, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const stats = productivityStats(tasks)
  const week = weekStats(tasks)

  const areaData = Object.entries(stats.byArea).map(([id, value]) => ({
    label: areas[id].label,
    value,
    color: areas[id].color,
  }))

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

        {stats.total === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
            <BarChart3 size={20} />
            <p>Noch keine Muster — hak ein paar Tasks ab, dann siehst du hier deine Statistik.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard icon={Trophy} label="Insgesamt erledigt" value={stats.total} />
              <MetricCard icon={Flame} label="Aktuelle Serie" value={`${week.streak} Tage`} />
              <MetricCard icon={Clock} label="Beste Zeit" value={stats.bestTimeOfDay ?? '–'} />
              <MetricCard icon={CalendarDays} label="Bester Tag" value={stats.bestWeekday ?? '–'} />
            </div>

            <section className="mb-8">
              <h3 className="mb-3 text-sm font-semibold text-ink-soft">Erledigt pro Bereich</h3>
              <BarChart data={areaData} />
            </section>

            <section className="mb-8">
              <h3 className="mb-3 text-sm font-semibold text-ink-soft">Produktivste Tageszeit</h3>
              <BarChart data={stats.byTimeOfDay} />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-ink-soft">Trend (letzte 6 Wochen)</h3>
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

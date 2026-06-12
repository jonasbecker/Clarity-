import { useState } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { WORK_WEEKDAYS } from '../lib/usePlanPrefs.js'

// Editor für die Arbeitszeiten je Wochentag.
//
// Eingeklappt zeigt er nur eine Zusammenfassung („Mo–Fr 09:00–18:00"). Geöffnet
// kann man jeden Tag einzeln an-/abschalten und sein Fenster setzen — plus ein
// Schnellknopf „Mo–Fr auf 09–18 setzen", der alle Werktage angleicht.
//
// Props: `prefs` (aus usePlanPrefs) mit days, setDay, applyToWorkdays,
// workStart/workEnd.
export default function WorkHoursEditor({ prefs }) {
  const [open, setOpen] = useState(false)

  // Kompakte Zusammenfassung der aktiven Tage fürs eingeklappte Label.
  const summary = summarize(prefs.days)

  return (
    <div className="mb-3 rounded-2xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm"
        aria-expanded={open}
      >
        <Clock size={15} className="shrink-0 text-ink-soft" />
        <span className="font-medium">Arbeitszeiten</span>
        <span className="ml-1 min-w-0 flex-1 truncate text-ink-soft">{summary}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-line px-4 py-3">
          {/* Schnellaktion: alle Werktage gleich */}
          <button
            type="button"
            onClick={() =>
              prefs.applyToWorkdays({ start: prefs.workStart, end: prefs.workEnd })
            }
            className="mb-3 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30"
          >
            Mo–Fr auf {prefs.workStart}–{prefs.workEnd} setzen
          </button>

          <ul className="space-y-1.5">
            {WORK_WEEKDAYS.map(({ wd, label }) => {
              const day = prefs.days?.[wd] ?? { enabled: false, start: '09:00', end: '18:00' }
              return (
                <li key={wd} className="flex items-center gap-2.5">
                  <label className="flex w-16 shrink-0 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(e) => prefs.setDay(wd, { enabled: e.target.checked })}
                      className="size-4 accent-[var(--color-ink)]"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                  {day.enabled ? (
                    <div className="flex items-center gap-1.5 text-sm text-ink-soft">
                      <input
                        type="time"
                        value={day.start}
                        onChange={(e) => prefs.setDay(wd, { start: e.target.value })}
                        aria-label={`${label} Beginn`}
                        className="rounded-lg border border-line bg-canvas px-2 py-1 text-ink outline-none focus:border-ink/30"
                      />
                      <span>–</span>
                      <input
                        type="time"
                        value={day.end}
                        onChange={(e) => prefs.setDay(wd, { end: e.target.value })}
                        aria-label={`${label} Ende`}
                        className="rounded-lg border border-line bg-canvas px-2 py-1 text-ink outline-none focus:border-ink/30"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-ink-soft">frei</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// Fasst die aktiven Tage zu einem kurzen Text zusammen. Sind alle aktiven Tage
// im selben Fenster, zeigen wir „Mo–Fr 09:00–18:00"; sonst „individuell".
function summarize(days) {
  if (!days) return ''
  const active = WORK_WEEKDAYS.filter(({ wd }) => days[wd]?.enabled)
  if (active.length === 0) return 'keine Arbeitstage'

  const first = days[active[0].wd]
  const sameWindow = active.every(
    ({ wd }) => days[wd].start === first.start && days[wd].end === first.end,
  )

  // Zusammenhängende Tagesnamen-Spanne (Mo–Fr) erkennen, sonst Liste.
  const labels = active.map((a) => a.label)
  const positions = active.map((a) => WORK_WEEKDAYS.findIndex((w) => w.wd === a.wd))
  const span = isContiguous(positions)
    ? `${labels[0]}–${labels[labels.length - 1]}`
    : labels.join(', ')

  return sameWindow ? `${span} ${first.start}–${first.end}` : 'individuell'
}

// Sind die (in Anzeige-Reihenfolge sortierten) Positionen lückenlos? Eine
// einzelne Position gilt nicht als Spanne (dann reicht der Tagesname selbst).
function isContiguous(positions) {
  if (positions.length < 2) return false
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] !== positions[i - 1] + 1) return false
  }
  return true
}

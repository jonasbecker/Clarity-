import { useState } from 'react'
import {
  Check,
  Sparkles,
  Loader2,
  CalendarPlus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  PartyPopper,
  Clock,
} from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import { SkeletonLine } from './Skeleton.jsx'
import WorkHoursEditor from './WorkHoursEditor.jsx'
import { useCollapsible } from '../lib/useCollapsible.js'
import { moveInOrder, reorderTo } from '../lib/usePlanOrder.js'
import { orderedPlanTasks } from '../lib/planTasks.js'
import { isoInDays, formatDueLabel, weekdayInDays } from '../lib/date.js'
import { buildAiWeek, freeMinutes } from '../lib/weekPlan.js'
import {
  buildSchedule,
  buildWeek,
  toMinutes,
  toHHMM,
  formatDuration,
} from '../lib/scheduler.js'

// Neutraler Akzent für die Abhak-Kreise im Plan (alle Aufgaben sind Studium).
const ACCENT = 'var(--color-area-study)'

// "Dein Tagesplan" — der KI-Kalender (Motion-Idee).
//
// Legt deine offenen Tasks automatisch als Zeitblöcke in die freien Lücken
// zwischen deinen Terminen, innerhalb deines Arbeitszeit-Fensters. Die
// Reihenfolge/Dauer kommt aus der Heuristik (immer da), aus der KI (Knopf)
// — oder von dir: per Drag & Drop bzw. Hoch/Runter ziehst du Tasks um.
//
// Zwei Ansichten: "Heute" (mit Terminen, Drag & Drop) und "Woche" (Tasks
// über mehrere Tage verteilt — was heute nicht passt, rutscht weiter).
export default function DayPlan({
  tasks,
  loading,
  eventsByDate,
  calendarStatus,
  onConnect,
  onToggle,
  prefs,
  ai,
  aiWeek,
  summary,
  onOptimize,
  planOrder,
  dayCount = 5,
}) {
  const aiLoading = ai.status === 'loading'
  const aiWeekLoading = aiWeek?.status === 'loading'
  const [view, setView] = useState('today') // 'today' | 'week'
  const [draggedId, setDraggedId] = useState(null)
  const { open, toggle } = useCollapsible('dayplan', true)

  // Termine pro Tag aus der Map ziehen: heute = offset 0, Folgetage 1..n.
  const todayEvents = eventsByDate[isoInDays(0)] || []
  const dayEvents = Array.from(
    { length: dayCount },
    (_, d) => eventsByDate[isoInDays(d)] || [],
  )

  // Arbeitszeit-Fenster je Tag-Offset aus den Wochentag-Einstellungen ableiten.
  // null = arbeitsfreier Tag. windowForWeekday liefert {start,end}; der
  // Scheduler erwartet {workStart,workEnd}, daher hier umbenennen.
  const windowForOffset = (d) => {
    const w = prefs.windowForWeekday?.(weekdayInDays(d))
    return w ? { workStart: w.start, workEnd: w.end } : null
  }
  const dayWindows = Array.from({ length: dayCount }, (_, d) => windowForOffset(d))
  const todayWindow = dayWindows[0] // Fenster für heute (oder null = frei)

  // Reihenfolge: KI/Heuristik, überschrieben von deiner manuellen Reihenfolge.
  // Geteilte Logik mit dem Fokus-Modus (lib/planTasks.js).
  const { ordered, aiActive } = orderedPlanTasks(
    tasks,
    ai.plan,
    ai.status,
    planOrder.order,
  )
  const manual = Boolean(planOrder.order)

  // ids der Task-Reihenfolge — Basis fürs Umsortieren (global, auch über Tage).
  const seq = ordered.map((t) => t.id)
  const move = (id, dir) => planOrder.setOrder(moveInOrder(seq, id, dir))
  const handleDrop = (targetId) => {
    if (draggedId) planOrder.setOrder(reorderTo(seq, draggedId, targetId))
    setDraggedId(null)
  }

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  // KI-Wochenplanung: Tag-Zuweisungen + Begründungen, wenn vorhanden.
  const weekAssignments =
    aiWeek?.status === 'ready' ? aiWeek.plan?.assignments ?? null : null
  const weekSummary = aiWeek?.status === 'ready' ? aiWeek.plan?.summary : null
  const reasonOf = new Map(
    (weekAssignments ?? []).map((a) => [a.id, a.reason]).filter(([, r]) => r),
  )

  // KI um eine Wochen-Verteilung bitten: jeder Tag mit seiner freien Kapazität.
  const planWeek = () => {
    if (!aiWeek) return
    const daysPayload = dayEvents.map((events, d) => {
      const win = dayWindows[d]
      return {
        day: d,
        label: formatDueLabel(isoInDays(d)) || 'Heute',
        frei_min: win ? freeMinutes(events, win.workStart, win.workEnd) : 0,
      }
    })
    aiWeek.generate({ tasks: ordered, days: daysPayload })
  }

  if (loading) {
    return (
      <section className="mb-10">
        <SectionTitle>Dein Tagesplan</SectionTitle>
        <div className="mb-3 flex items-center gap-2">
          <SkeletonLine className="h-6 w-40" />
          <SkeletonLine className="ml-auto h-6 w-24" />
        </div>
        <div className="space-y-3 rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-5/6" />
          <SkeletonLine className="h-4 w-2/3" />
        </div>
      </section>
    )
  }

  return (
    <section className="mb-10">
      <SectionTitle
        collapsible
        open={open}
        onToggle={toggle}
        aside={
          tasks.length > 0 ? (
            <span className="inline-flex items-center gap-2">
              {manual && (
                <button
                  type="button"
                  onClick={planOrder.reset}
                  className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink/30"
                >
                  <RotateCcw size={12} />
                  Auto
                </button>
              )}
              <button
                type="button"
                onClick={onOptimize}
                disabled={aiLoading}
                className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium transition-colors hover:border-ink/30 disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} className="text-area-study" />
                )}
                {aiLoading ? 'Plant …' : aiActive ? 'KI-optimiert' : 'Mit KI optimieren'}
              </button>
            </span>
          ) : null
        }
      >
        Dein Tagesplan
      </SectionTitle>

      {open && (
        <>
          {/* KI-Tagesüberblick, wenn vorhanden */}
          {summary && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-area-study" />
              <p>{summary}</p>
            </div>
          )}

          {/* Ansicht-Umschalter Heute/Woche */}
          <div className="mb-3 flex justify-end">
            <div className="inline-flex rounded-full border border-line p-0.5">
              {[
                { id: 'today', label: 'Heute' },
                { id: 'week', label: 'Woche' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    view === v.id ? 'bg-ink text-canvas' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Arbeitszeiten je Wochentag */}
          <WorkHoursEditor prefs={prefs} />

          {ai.error && <p className="mb-3 text-sm text-danger">KI: {ai.error}</p>}

          {view === 'today' ? (
            !todayWindow ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
                <PartyPopper size={20} />
                <p>Heute ist ein arbeitsfreier Tag — nichts eingeplant. Genieß ihn!</p>
              </div>
            ) : (
              <TodayPlan
                ordered={ordered}
                events={todayEvents}
                window={todayWindow}
                nowMin={nowMin}
                seq={seq}
                onToggle={onToggle}
                onMove={move}
                tasksCount={tasks.length}
                draggedId={draggedId}
                setDraggedId={setDraggedId}
                handleDrop={handleDrop}
              />
            )
          ) : (
            <>
              {/* KI-Wochenplanung: verteilt die Tasks proaktiv auf die Tage */}
              {aiWeek && tasks.length > 0 && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={planWeek}
                    disabled={aiWeekLoading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-ink/30 disabled:opacity-50"
                  >
                    {aiWeekLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} className="text-area-study" />
                    )}
                    {aiWeekLoading
                      ? 'Plant Woche …'
                      : weekAssignments
                        ? 'Woche neu planen'
                        : 'Woche mit KI planen'}
                  </button>
                  {weekSummary && (
                    <p className="mt-2 rounded-xl bg-surface px-4 py-2.5 text-sm text-ink-soft">
                      {weekSummary}
                    </p>
                  )}
                  {aiWeek.error && (
                    <p className="mt-2 text-sm text-danger">KI: {aiWeek.error}</p>
                  )}
                </div>
              )}

              <WeekPlan
                ordered={ordered}
                dayEvents={dayEvents}
                dayWindows={dayWindows}
                prefs={prefs}
                nowMin={nowMin}
                seq={seq}
                onToggle={onToggle}
                onMove={move}
                dayCount={dayCount}
                assignments={weekAssignments}
                reasonOf={reasonOf}
              />
            </>
          )}

          {/* Tipp: echten Kalender verbinden */}
          {(calendarStatus === 'idle' || calendarStatus === 'error') && (
            <button
              type="button"
              onClick={onConnect}
              className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
            >
              <CalendarPlus size={15} />
              Google Kalender verbinden, um echte Termine einzuplanen
            </button>
          )}
        </>
      )}
    </section>
  )
}

// --- Ansicht "Heute": reicher Zeitstrahl mit Terminen + Drag & Drop ---
function TodayPlan({
  ordered,
  events,
  window: win,
  nowMin,
  seq,
  onToggle,
  onMove,
  tasksCount,
  draggedId,
  setDraggedId,
  handleDrop,
}) {
  const { blocks, unscheduled } = buildSchedule({
    tasks: ordered,
    events,
    workStart: win.workStart,
    workEnd: win.workEnd,
    now: nowMin,
  })

  const timedEvents = events.filter((e) => !e.allDay && e.start)
  const allDayEvents = events.filter((e) => e.allDay)
  const agenda = [
    ...timedEvents.map((e) => ({
      kind: 'event',
      start: toMinutes(e.start),
      endMin: e.end ? toMinutes(e.end) : toMinutes(e.start),
      label: e.start,
      title: e.title,
    })),
    ...blocks.map((b) => ({
      kind: 'task',
      start: b.start,
      endMin: b.end,
      label: toHHMM(b.start),
      end: toHHMM(b.end),
      task: b.task,
      reason: b.task.reason,
    })),
  ].sort((a, b) => a.start - b.start)

  return (
    <>
      {allDayEvents.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {allDayEvents.map((e) => (
            <span
              key={e.id}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-soft"
            >
              📌 {e.title}
            </span>
          ))}
        </div>
      )}

      {agenda.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
          {tasksCount === 0 ? <PartyPopper size={20} /> : <Clock size={20} />}
          <p>
            {tasksCount === 0
              ? 'Keine offenen Tasks — nichts zu planen. Genieß den Tag!'
              : 'Außerhalb deiner Arbeitszeit — passe das Fenster oben an, um zu planen.'}
          </p>
        </div>
      ) : (
        <ul className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          {agenda.map((item, i) => {
            const past = item.endMin <= nowMin
            const isNow = item.start <= nowMin && nowMin < item.endMin
            return item.kind === 'event' ? (
              <EventRow
                key={`e${i}`}
                item={item}
                last={i === agenda.length - 1}
                past={past}
                now={isNow}
              />
            ) : (
              <TaskRow
                key={item.task.id}
                item={item}
                last={i === agenda.length - 1}
                past={past}
                now={isNow}
                onToggle={onToggle}
                onMove={onMove}
                pos={seq.indexOf(item.task.id)}
                total={seq.length}
                dragging={draggedId === item.task.id}
                onDragStart={() => setDraggedId(item.task.id)}
                onDragEnd={() => setDraggedId(null)}
                onDrop={() => handleDrop(item.task.id)}
              />
            )
          })}
        </ul>
      )}

      {unscheduled.length > 0 && (
        <Overflow tasks={unscheduled} label="Passt heute nicht mehr rein" />
      )}
    </>
  )
}

// --- Ansicht "Woche": Tasks über mehrere Tage verteilt ---
// Ohne KI-Zuweisungen verteilt buildWeek per Überlauf; mit Zuweisungen
// bestimmt die KI den Tag (buildAiWeek), der Scheduler die Uhrzeit.
function WeekPlan({
  ordered,
  dayEvents,
  dayWindows,
  prefs,
  nowMin,
  seq,
  onToggle,
  onMove,
  dayCount,
  assignments,
  reasonOf,
}) {
  const { days, unscheduled } =
    assignments && assignments.length
      ? buildAiWeek({
          ordered,
          dayEvents,
          dayWindows,
          assignments,
          workStart: prefs.workStart,
          workEnd: prefs.workEnd,
          dayCount,
          now: nowMin,
        })
      : buildWeek({
          tasks: ordered,
          dayEvents,
          dayWindows,
          workStart: prefs.workStart,
          workEnd: prefs.workEnd,
          dayCount,
          now: nowMin,
        })

  const anyPlanned = days.some((d) => d.blocks.length > 0)

  return (
    <>
      {!anyPlanned ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
          <PartyPopper size={20} />
          <p>Nichts zu planen — alle Tasks erledigt oder kein Platz im Fenster.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day) => (
            <DayCard
              key={day.offset}
              day={day}
              seq={seq}
              onToggle={onToggle}
              onMove={onMove}
              reasonOf={reasonOf}
            />
          ))}
        </div>
      )}

      {unscheduled.length > 0 && (
        <Overflow tasks={unscheduled} label="Passt diese Woche nicht rein" />
      )}
    </>
  )
}

// Eine Tages-Karte in der Wochenansicht: Datum + geplante Blöcke (kompakt).
function DayCard({ day, seq, onToggle, onMove, reasonOf }) {
  const label = formatDueLabel(isoInDays(day.offset)) || 'Heute'
  const total = day.blocks.reduce((s, b) => s + (b.end - b.start), 0)

  const items = [
    ...day.events
      .filter((e) => !e.allDay && e.start)
      .map((e) => ({ kind: 'event', start: toMinutes(e.start), label: e.start, title: e.title })),
    ...day.blocks.map((b) => ({
      kind: 'task',
      start: b.start,
      label: toHHMM(b.start),
      end: toHHMM(b.end),
      task: b.task,
    })),
  ].sort((a, b) => a.start - b.start)

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold capitalize">{label}</h3>
        <span className="text-xs text-ink-soft">
          {total ? formatDuration(total) : 'frei'}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ink-soft">Nichts geplant.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) =>
            it.kind === 'event' ? (
              <li
                key={`e${i}`}
                className="flex items-center gap-2 text-sm text-ink-soft"
              >
                <span className="w-20 shrink-0 text-right tabular-nums">{it.label}</span>
                <span className="size-2 shrink-0 rounded-full bg-ink-soft" aria-hidden="true" />
                <span className="min-w-0 truncate">{it.title}</span>
              </li>
            ) : (
              <CompactTaskRow
                key={it.task.id}
                item={it}
                seq={seq}
                onToggle={onToggle}
                onMove={onMove}
                reason={reasonOf?.get(it.task.id)}
              />
            ),
          )}
        </ul>
      )}
    </div>
  )
}

// Kompakte Task-Zeile in der Wochenansicht (mit Hoch/Runter).
// `reason` (optional): kurze KI-Begründung für den gewählten Tag.
function CompactTaskRow({ item, seq, onToggle, onMove, reason }) {
  const pos = seq.indexOf(item.task.id)
  const total = seq.length
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="w-20 shrink-0 text-right tabular-nums text-ink-soft">
        {item.label}–{item.end}
      </span>
      <button
        type="button"
        onClick={() => onToggle(item.task.id)}
        aria-label="Als erledigt markieren"
        className="group grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors"
        style={{ borderColor: ACCENT }}
      >
        <Check
          size={10}
          strokeWidth={3}
          style={{ color: ACCENT }}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
      </button>
      <span className="min-w-0 flex-1 truncate">
        {item.task.title}
        {reason && <span className="ml-1.5 text-xs text-ink-soft">· {reason}</span>}
      </span>
      <span className="flex shrink-0 text-ink-soft">
        <button
          type="button"
          onClick={() => onMove(item.task.id, 'up')}
          disabled={pos <= 0}
          aria-label="Früher einplanen"
          className="grid size-6 place-items-center rounded transition-colors hover:text-ink disabled:opacity-25"
        >
          <ChevronUp size={15} />
        </button>
        <button
          type="button"
          onClick={() => onMove(item.task.id, 'down')}
          disabled={pos >= total - 1}
          aria-label="Später einplanen"
          className="grid size-6 place-items-center rounded transition-colors hover:text-ink disabled:opacity-25"
        >
          <ChevronDown size={15} />
        </button>
      </span>
    </li>
  )
}

// Liste der Tasks, die im geplanten Zeitraum nicht mehr reinpassen.
function Overflow({ tasks, label }) {
  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface px-5 py-4">
      <p className="text-sm font-medium">
        {label} ({tasks.length})
      </p>
      <ul className="mt-2 space-y-1">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm text-ink-soft">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: ACCENT }}
              aria-hidden="true"
            />
            <span className="truncate">{t.title}</span>
            <span className="ml-auto shrink-0 text-xs">
              {formatDuration(t.duration_min)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Eine Zeile: fixer Termin (grau, nicht abhakbar, nicht verschiebbar).
// `past` = schon vorbei (ausgegraut), `now` = läuft gerade.
function EventRow({ item, last, past, now }) {
  return (
    <li className={`flex gap-3 transition-opacity ${past ? 'opacity-40' : ''}`}>
      <div className="w-12 shrink-0 pt-0.5 text-right text-sm tabular-nums text-ink-soft">
        {item.label}
      </div>
      <div className="relative flex flex-col items-center">
        <span
          className="mt-1.5 size-2.5 rounded-full bg-ink-soft ring-4 ring-surface"
          aria-hidden="true"
        />
        {!last && <span className="w-px grow bg-line" aria-hidden="true" />}
      </div>
      <div className="pb-5">
        <p className="font-medium leading-snug">{item.title}</p>
        <p className="text-xs text-ink-soft">
          {now ? 'Jetzt · Termin' : 'Termin'}
        </p>
      </div>
    </li>
  )
}

// Eine Zeile: geplanter Task-Block (Bereichsfarbe, abhakbar, verschiebbar).
function TaskRow({
  item,
  last,
  past,
  now,
  onToggle,
  onMove,
  pos,
  total,
  dragging,
  onDragStart,
  onDragEnd,
  onDrop,
}) {
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={`flex gap-3 rounded-lg transition-opacity ${
        dragging || past ? 'opacity-40' : ''
      }`}
    >
      <div className="w-12 shrink-0 pt-0.5 text-right text-sm tabular-nums text-ink-soft">
        {item.label}
      </div>
      <div className="relative flex flex-col items-center">
        <button
          type="button"
          onClick={() => onToggle(item.task.id)}
          aria-label="Als erledigt markieren"
          className="group mt-1 grid size-4 place-items-center rounded-full border-2 ring-4 ring-surface transition-colors"
          style={{ borderColor: ACCENT }}
        >
          <Check
            size={10}
            strokeWidth={3}
            style={{ color: ACCENT }}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          />
        </button>
        {!last && <span className="w-px grow bg-line" aria-hidden="true" />}
      </div>
      <div className="flex flex-1 items-start justify-between gap-2 pb-5">
        <div className="min-w-0">
          <p className="font-medium leading-snug">{item.task.title}</p>
          <p className="text-xs text-ink-soft">
            {now ? 'Jetzt · ' : ''}
            {item.label}–{item.end}
            {item.reason ? ` · ${item.reason}` : ''}
          </p>
        </div>

        {/* Umsortieren: Greifer (Desktop-Drag) + Hoch/Runter (überall) */}
        <div className="flex shrink-0 items-center text-ink-soft">
          <GripVertical
            size={15}
            className="hidden cursor-grab opacity-50 sm:block"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => onMove(item.task.id, 'up')}
            disabled={pos <= 0}
            aria-label="Früher einplanen"
            className="grid size-6 place-items-center rounded transition-colors hover:text-ink disabled:opacity-25"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => onMove(item.task.id, 'down')}
            disabled={pos >= total - 1}
            aria-label="Später einplanen"
            className="grid size-6 place-items-center rounded transition-colors hover:text-ink disabled:opacity-25"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </li>
  )
}

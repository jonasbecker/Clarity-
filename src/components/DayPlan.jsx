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
} from 'lucide-react'
import SectionTitle from './SectionTitle.jsx'
import { areas } from '../data/dummyData.js'
import { moveInOrder, reorderTo } from '../lib/usePlanOrder.js'
import { orderedPlanTasks } from '../lib/planTasks.js'
import { isoInDays, formatDueLabel } from '../lib/date.js'
import {
  buildSchedule,
  buildWeek,
  toMinutes,
  toHHMM,
  formatDuration,
} from '../lib/scheduler.js'

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
  eventsByDate,
  calendarStatus,
  onConnect,
  onToggle,
  prefs,
  ai,
  onOptimize,
  planOrder,
  dayCount = 5,
}) {
  const aiLoading = ai.status === 'loading'
  const [view, setView] = useState('today') // 'today' | 'week'
  const [draggedId, setDraggedId] = useState(null)

  // Termine pro Tag aus der Map ziehen: heute = offset 0, Folgetage 1..n.
  const todayEvents = eventsByDate[isoInDays(0)] || []
  const dayEvents = Array.from(
    { length: dayCount },
    (_, d) => eventsByDate[isoInDays(d)] || [],
  )

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

  return (
    <section className="mb-10">
      <SectionTitle
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

      {/* Arbeitszeit-Fenster + Ansicht-Umschalter */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <span>Arbeitszeit</span>
        <input
          type="time"
          value={prefs.workStart}
          onChange={(e) => prefs.setWorkStart(e.target.value)}
          aria-label="Arbeitsbeginn"
          className="rounded-lg border border-line bg-surface px-2 py-1 text-ink outline-none focus:border-ink/30"
        />
        <span>–</span>
        <input
          type="time"
          value={prefs.workEnd}
          onChange={(e) => prefs.setWorkEnd(e.target.value)}
          aria-label="Arbeitsende"
          className="rounded-lg border border-line bg-surface px-2 py-1 text-ink outline-none focus:border-ink/30"
        />

        <div className="ml-auto inline-flex rounded-full border border-line p-0.5">
          {[
            { id: 'today', label: 'Heute' },
            { id: 'week', label: 'Woche' },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                view === v.id ? 'bg-ink text-canvas' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {ai.error && <p className="mb-3 text-sm text-danger">KI: {ai.error}</p>}

      {view === 'today' ? (
        <TodayPlan
          ordered={ordered}
          events={todayEvents}
          prefs={prefs}
          nowMin={nowMin}
          seq={seq}
          onToggle={onToggle}
          onMove={move}
          tasksCount={tasks.length}
          draggedId={draggedId}
          setDraggedId={setDraggedId}
          handleDrop={handleDrop}
        />
      ) : (
        <WeekPlan
          ordered={ordered}
          dayEvents={dayEvents}
          prefs={prefs}
          nowMin={nowMin}
          seq={seq}
          onToggle={onToggle}
          onMove={move}
          dayCount={dayCount}
        />
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
    </section>
  )
}

// --- Ansicht "Heute": reicher Zeitstrahl mit Terminen + Drag & Drop ---
function TodayPlan({
  ordered,
  events,
  prefs,
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
    workStart: prefs.workStart,
    workEnd: prefs.workEnd,
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
        <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          {tasksCount === 0
            ? 'Keine offenen Tasks — nichts zu planen. Genieß den Tag ✨'
            : 'Außerhalb deiner Arbeitszeit — passe das Fenster oben an, um zu planen.'}
        </p>
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
function WeekPlan({ ordered, dayEvents, prefs, nowMin, seq, onToggle, onMove, dayCount }) {
  const { days, unscheduled } = buildWeek({
    tasks: ordered,
    dayEvents,
    workStart: prefs.workStart,
    workEnd: prefs.workEnd,
    dayCount,
    now: nowMin,
  })

  const anyPlanned = days.some((d) => d.blocks.length > 0)

  return (
    <>
      {!anyPlanned ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          Nichts zu planen — alle Tasks erledigt oder kein Platz im Fenster.
        </p>
      ) : (
        <div className="space-y-3">
          {days.map((day) => (
            <DayCard
              key={day.offset}
              day={day}
              seq={seq}
              onToggle={onToggle}
              onMove={onMove}
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
function DayCard({ day, seq, onToggle, onMove }) {
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
              />
            ),
          )}
        </ul>
      )}
    </div>
  )
}

// Kompakte Task-Zeile in der Wochenansicht (mit Hoch/Runter).
function CompactTaskRow({ item, seq, onToggle, onMove }) {
  const area = areas[item.task.area]
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
        style={{ borderColor: area.color }}
      >
        <Check
          size={10}
          strokeWidth={3}
          style={{ color: area.color }}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
      </button>
      <span className="min-w-0 flex-1 truncate">{item.task.title}</span>
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
              style={{ backgroundColor: areas[t.area].color }}
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
  const area = areas[item.task.area]
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
          style={{ borderColor: area.color }}
        >
          <Check
            size={10}
            strokeWidth={3}
            style={{ color: area.color }}
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

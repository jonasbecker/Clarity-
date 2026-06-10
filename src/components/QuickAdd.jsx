import { Plus, X } from 'lucide-react'
import { areas } from '../data/dummyData.js'
import { formatDuration } from '../lib/scheduler.js'

// "Schnell hinzufügen": Chips aus deinen Vorlagen. Ein Tipp auf den Chip legt
// sofort eine Task für heute an (mit Bereich/Dauer/Wiederholung der Vorlage);
// das × entfernt die Vorlage. Erscheint nur, wenn es Vorlagen gibt.
export default function QuickAdd({ templates, onUse, onRemove }) {
  if (templates.length === 0) return null

  return (
    <section className="mb-8">
      <p className="mb-2 text-sm font-medium text-ink-soft">Schnell hinzufügen</p>
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => {
          const area = areas[t.area]
          return (
            <span
              key={t.id}
              className="group inline-flex items-center rounded-full border border-line bg-surface text-sm transition-colors hover:border-ink/30"
            >
              <button
                type="button"
                onClick={() => onUse(t)}
                className="inline-flex items-center gap-2 py-1.5 pl-3 pr-2"
                aria-label={`„${t.title}" für heute anlegen`}
              >
                <Plus size={13} className="text-ink-soft" />
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: area.color }}
                  aria-hidden="true"
                />
                <span>{t.title}</span>
                <span className="text-xs text-ink-soft">
                  {formatDuration(t.duration_min)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(t.id)}
                aria-label={`Vorlage „${t.title}" löschen`}
                className="grid size-7 place-items-center rounded-full text-ink-soft transition-colors hover:text-danger"
              >
                <X size={13} />
              </button>
            </span>
          )
        })}
      </div>
    </section>
  )
}

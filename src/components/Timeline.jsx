import SectionTitle from './SectionTitle.jsx'
import TimelineItem from './TimelineItem.jsx'

// Kompakter Tagesplan / Timeline aus Kalender-Terminen.
export default function Timeline({ events }) {
  return (
    <section className="mb-10">
      <SectionTitle aside={`${events.length} Termine`}>
        Dein Tag
      </SectionTitle>
      <ul className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        {events.map((event) => (
          <TimelineItem key={event.id} event={event} />
        ))}
      </ul>
    </section>
  )
}

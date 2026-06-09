import { getGreeting, formatLongDate } from '../lib/date.js'

// Header: persönliche Begrüßung + heutiges Datum.
// `name` kommt als Prop rein — die Komponente kennt keine Datenquelle.
export default function Header({ name }) {
  return (
    <header className="mb-8">
      <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">
        {formatLongDate()}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
        {getGreeting()}, {name}
      </h1>
    </header>
  )
}

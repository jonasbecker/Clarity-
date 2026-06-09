// Wählt die "Fokus heute"-Tasks aus deinen echten Tasks aus.
//
// Noch keine KI — eine simple, nachvollziehbare Regel: offene Tasks nach
// Dringlichkeit der Fälligkeit sortieren und die wichtigsten 3 nehmen.
// In Phase 3 ersetzen wir diese Funktion durch einen KI-Vorschlag; die UI
// bleibt gleich (wieder der saubere Schnitt).

// Kleiner = dringender. Unbekannte Texte landen im Mittelfeld, "ohne Datum"
// ganz hinten.
function urgency(due) {
  if (!due) return 3
  const d = due.toLowerCase()
  if (d.includes('heute')) return 0
  if (d.includes('morgen')) return 1
  return 2 // "Diese Woche", "Bis Freitag", …
}

export function selectFocusTasks(tasks, limit = 3) {
  return tasks
    .filter((t) => !t.done) // nur offene
    .slice() // Kopie, damit wir das Original nicht umsortieren
    .sort((a, b) => urgency(a.due) - urgency(b.due))
    .slice(0, limit)
}

// Reine Helfer für Tags (frei wählbare Schlagwörter quer zu den Bereichen).
// Tags liegen als String-Array `["Uni", "dringend"]` am Task-Objekt — in
// Supabase als JSONB-Spalte, im Demo-Modus einfach Teil des Objekts.
// Alle Funktionen sind unveränderlich (geben ein neues Array zurück).

// Vereinheitlicht eine Eingabe: trimmen, führendes '#' und Kommas entfernen.
export function normalizeTag(label) {
  return label.trim().replace(/^#+/, '').replace(/,/g, '').trim()
}

export function addTag(tags, label) {
  const clean = normalizeTag(label)
  if (!clean) return tags
  // Doppelte (auch in anderer Groß-/Kleinschreibung) vermeiden.
  if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) return tags
  return [...tags, clean]
}

export function removeTag(tags, label) {
  return tags.filter((t) => t !== label)
}

// Alle in den Tasks vorkommenden Tags, alphabetisch, ohne Duplikate.
export function allTags(tasks) {
  const seen = new Map() // kleingeschrieben → Anzeigeform
  for (const t of tasks) {
    for (const tag of Array.isArray(t.tags) ? t.tags : []) {
      const key = tag.toLowerCase()
      if (!seen.has(key)) seen.set(key, tag)
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'de'))
}

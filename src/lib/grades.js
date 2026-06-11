// Reine Berechnungen für den Notenspiegel (ECTS-gewichtet).
//
// Note im deutschen System: 1.0 (sehr gut) … 5.0 (nicht bestanden). Eine Note
// von null bedeutet "noch nicht benotet" und zählt nirgends mit. ECTS ohne
// Wert (null/0) tragen nicht zur Gewichtung bei.

const PASS = 4.0 // bestanden bis einschließlich 4.0

function hasGrade(c) {
  return c.grade != null && Number.isFinite(Number(c.grade))
}

function ectsOf(c) {
  const n = Number(c.ects)
  return Number.isFinite(n) && n > 0 ? n : 0
}

// ECTS-gewichteter Notenschnitt über alle benoteten Kurse mit ECTS > 0.
// Liefert null, wenn es (noch) keine benotete Grundlage gibt.
export function weightedAverage(courses) {
  let sum = 0
  let weight = 0
  for (const c of courses) {
    if (!hasGrade(c)) continue
    const w = ectsOf(c)
    if (w === 0) continue
    sum += Number(c.grade) * w
    weight += w
  }
  if (weight === 0) return null
  return Math.round((sum / weight) * 100) / 100
}

// Summe aller ECTS (Kurse mit gültigem ECTS-Wert).
export function totalEcts(courses) {
  return courses.reduce((acc, c) => acc + ectsOf(c), 0)
}

// Bereits "geschaffte" ECTS: benotete und bestandene Kurse (Note ≤ 4.0).
export function earnedEcts(courses) {
  return courses.reduce(
    (acc, c) => (hasGrade(c) && Number(c.grade) <= PASS ? acc + ectsOf(c) : acc),
    0,
  )
}

// Kurse nach Semester gruppieren, je Gruppe Schnitt + ECTS.
export function bySemester(courses) {
  const groups = new Map()
  for (const c of courses) {
    const key = c.semester || 'Ohne Semester'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(c)
  }
  return [...groups.entries()].map(([semester, list]) => ({
    semester,
    courses: list,
    avg: weightedAverage(list),
    ects: totalEcts(list),
  }))
}

// Deutsche Notendarstellung: "2,3" — oder "–" wenn keine Note. `decimals`
// steuert die Nachkommastellen (Einzelnoten 1, Schnitt z.B. 2).
export function formatGrade(n, decimals = 1) {
  if (n == null || !Number.isFinite(Number(n))) return '–'
  return Number(n).toFixed(decimals).replace('.', ',')
}

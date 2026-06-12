import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimateMinutesByCategory, hasCategoryEstimateBasis } from './estimate.js'

const tasks = [
  { title: 'Mathe Aufgabenblatt 3', done: true, actual_min: 60, tags: ['Rechenaufgabe'], course_id: 'math' },
  { title: 'Übungsblatt Integralrechnung', done: true, actual_min: 50, tags: ['Rechenaufgabe'], course_id: 'math' },
  { title: 'Quiz Kapitel 1', done: true, actual_min: 20, tags: ['Multiple Choice'], course_id: 'math' },
]

test('hasCategoryEstimateBasis findet erledigte Tasks mit passendem Kategorie-Tag', () => {
  assert.equal(hasCategoryEstimateBasis('Rechenaufgabe', 'math', tasks), true)
  assert.equal(hasCategoryEstimateBasis('Diskussion', 'math', tasks), false)
})

test('estimateMinutesByCategory: Median über gleiche Kategorie, unterschiedliche Titel', () => {
  // median(60, 50) = 55
  assert.equal(estimateMinutesByCategory('Rechenaufgabe', 'math', tasks), 55)
})

test('estimateMinutesByCategory: Fallback ohne Vergleichsdaten', () => {
  assert.equal(estimateMinutesByCategory('Diskussion', 'math', tasks), 30)
  assert.equal(estimateMinutesByCategory('Diskussion', 'math', tasks, 45), 45)
})

test('estimateMinutesByCategory: Tag-Vergleich ist case-insensitiv', () => {
  const t = [{ title: 'Beliebiger Titel', done: true, actual_min: 40, tags: ['rechenaufgabe'], course_id: 'math' }]
  assert.equal(estimateMinutesByCategory('Rechenaufgabe', 'math', t), 40)
})

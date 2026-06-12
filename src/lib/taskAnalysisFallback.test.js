import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimatePriority, analyzeTaskFallback } from './taskAnalysisFallback.js'

test('estimatePriority: überwiegende AB III-Verben -> high', () => {
  assert.equal(estimatePriority('Essay', 'Diskutiere und beurteile kritisch die Position.'), 'high')
})

test('estimatePriority: nur AB I-Verben + kurzer Text -> low', () => {
  assert.equal(estimatePriority('Quiz', 'Nenne drei Hauptstädte.'), 'low')
})

test('estimatePriority: Klausur-Schlüsselwort bleibt -> high', () => {
  assert.equal(estimatePriority('Klausur Vorbereitung', 'Bearbeite die folgenden Aufgaben.'), 'high')
})

test('analyzeTaskFallback liefert eine Kategorie', () => {
  const res = analyzeTaskFallback({ title: 'Mathe', text: 'Berechne die Ableitung von f(x) = x^2.' })
  assert.equal(res.category, 'Rechenaufgabe')
})

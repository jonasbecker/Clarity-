import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectOperators, estimateCategory } from './operators.js'

test('detectOperators erkennt AB I- und AB III-Verben', () => {
  const ops = detectOperators('Nenne drei Beispiele und beurteile die Aussage kritisch.')
  const levels = ops.map((o) => o.level)
  assert.ok(levels.includes('I'))
  assert.ok(levels.includes('III'))
})

test('estimateCategory: Ankreuzfelder -> Multiple Choice', () => {
  assert.equal(
    estimateCategory('Quiz', 'Kreuze die richtige Antwort an: [ ] A  [ ] B  [ ] C'),
    'Multiple Choice',
  )
})

test('estimateCategory: Rechen-Operatoren -> Rechenaufgabe', () => {
  assert.equal(
    estimateCategory('Mathe Aufgabenblatt', 'Berechne den Wert von x. Bestimme die Nullstellen der Funktion.'),
    'Rechenaufgabe',
  )
})

test('estimateCategory: AB III-Operatoren -> Diskussion', () => {
  assert.equal(
    estimateCategory('Ethik Essay', 'Diskutiere die Vor- und Nachteile. Beurteile die Argumentation kritisch.'),
    'Diskussion',
  )
})

test('estimateCategory: anwenden/übertragen -> Anwendungsaufgabe', () => {
  assert.equal(
    estimateCategory('Physik', 'Beispiel zur Anwendung der Formel: übertrage das Ergebnis auf die Praxis.'),
    'Anwendungsaufgabe',
  )
})

test('estimateCategory: ohne erkennbares Muster -> Wissensfrage (Default)', () => {
  assert.equal(estimateCategory('Geschichte', 'Wann war der Wiener Kongress?'), 'Wissensfrage')
})

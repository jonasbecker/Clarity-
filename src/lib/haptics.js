// Kurzes haptisches Feedback (sofern das Gerät es unterstützt).
// Auf iOS/Safari gibt es keine Vibrations-API — dann passiert einfach nichts.
export function tap(pattern = 12) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  } catch {
    // Vibration nicht verfügbar — bewusst ignorieren.
  }
}

import { useRef, useState } from 'react'

// Sprache → Text über die Web Speech API des Browsers (gratis, kein Backend).
// Nicht jeder Browser kann das — `supported` sagt, ob der Mikrofon-Knopf
// überhaupt sinnvoll ist. onResult liefert laufend den erkannten Text.
export function useSpeech({ onResult, lang = 'de-DE' } = {}) {
  const Recognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  const supported = Boolean(Recognition)

  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  function start() {
    if (!supported || listening) return
    const rec = new Recognition()
    rec.lang = lang
    rec.interimResults = true // schon während des Sprechens Text liefern
    rec.continuous = false // nach einer Pause automatisch beenden

    rec.onresult = (event) => {
      let text = ''
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      onResult?.(text)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)

    recRef.current = rec
    setListening(true)
    rec.start()
  }

  function stop() {
    recRef.current?.stop()
    setListening(false)
  }

  return { supported, listening, start, stop }
}

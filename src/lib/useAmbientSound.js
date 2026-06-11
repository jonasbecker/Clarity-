import { useEffect, useRef, useState } from 'react'

// Ambient-Sounds OHNE Audiodateien: alles wird live per Web Audio API erzeugt
// (gefiltertes Rauschen). Das hält die App schlank und kostenlos. Wegen der
// Autoplay-Regeln der Browser startet der Klang erst nach einer Nutzer-Geste
// (Klick auf einen Sound-Knopf).
export const SOUND_PRESETS = [
  { id: 'off', label: 'Aus' },
  { id: 'regen', label: 'Regen' },
  { id: 'rauschen', label: 'Rauschen' },
  { id: 'wind', label: 'Wind' },
]

// Pro Preset: welche Rausch-Art, welcher Tiefpass und wie laut.
const CONFIG = {
  regen: { noise: 'white', freq: 5500, q: 0.7, gain: 0.5 },
  rauschen: { noise: 'white', freq: 12000, q: 0.5, gain: 0.35 },
  wind: { noise: 'brown', freq: 600, q: 0.9, gain: 0.8 },
}

// Zwei Sekunden Rauschen als Schleifen-Puffer. 'brown' klingt tiefer/weicher
// (für Wind), 'white' heller (für Regen/Rauschen).
function makeNoiseBuffer(ctx, type) {
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  if (type === 'brown') {
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      data[i] = last * 3.5
    }
  } else {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  }
  return buf
}

export function useAmbientSound() {
  const [preset, setPresetState] = useState('off')
  const [volume, setVolumeState] = useState(0.6)
  const ctxRef = useRef(null)
  const gainRef = useRef(null)
  const srcRef = useRef(null)
  const buffers = useRef({})

  function ensureCtx() {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return null
      const ctx = new Ctx()
      const g = ctx.createGain()
      g.gain.value = volume
      g.connect(ctx.destination)
      ctxRef.current = ctx
      gainRef.current = g
    }
    return ctxRef.current
  }

  function stopSource() {
    if (srcRef.current) {
      try {
        srcRef.current.stop()
      } catch {
        // bereits gestoppt — egal
      }
      try {
        srcRef.current.disconnect()
      } catch {
        // ignore
      }
      srcRef.current = null
    }
  }

  function play(id) {
    const ctx = ensureCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    stopSource()
    const cfg = CONFIG[id]
    if (!cfg) return
    if (!buffers.current[cfg.noise]) {
      buffers.current[cfg.noise] = makeNoiseBuffer(ctx, cfg.noise)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffers.current[cfg.noise]
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = cfg.freq
    filter.Q.value = cfg.q
    const presetGain = ctx.createGain()
    presetGain.gain.value = cfg.gain
    src.connect(filter)
    filter.connect(presetGain)
    presetGain.connect(gainRef.current)
    src.start()
    srcRef.current = src
  }

  function setPreset(id) {
    setPresetState(id)
    if (id === 'off') stopSource()
    else play(id)
  }

  function setVolume(v) {
    setVolumeState(v)
    if (gainRef.current) gainRef.current.gain.value = v
  }

  // Aufräumen beim Verlassen der Ansicht: Klang stoppen und Context schließen.
  useEffect(
    () => () => {
      stopSource()
      if (ctxRef.current) {
        try {
          ctxRef.current.close()
        } catch {
          // ignore
        }
      }
    },
    [],
  )

  return { preset, setPreset, volume, setVolume, presets: SOUND_PRESETS }
}

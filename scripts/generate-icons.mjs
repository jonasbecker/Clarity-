// Erzeugt die PWA-Icons als PNG, ohne externe Bild-Tools.
// Wir bauen die Pixel selbst (RGBA), komprimieren mit zlib und
// schreiben gültige PNG-Dateien. Das Motiv passt zum favicon.svg:
// dunkler, abgerundeter Hintergrund + weißer Ring + farbiger Punkt.
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// --- Farben (RGB) ---
const BG = [15, 15, 16] // #0f0f10
const RING = [255, 255, 255] // weiß
const DOT = [99, 102, 241] // #6366f1 (Studium-Akzent)

// CRC32-Tabelle für PNG-Chunks.
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

// Mischt Vordergrundfarbe über Hintergrund mit Deckkraft `a` (0..1) —
// für weiche Kanten (Anti-Aliasing).
function blend(bg, fg, a) {
  return [
    Math.round(bg[0] * (1 - a) + fg[0] * a),
    Math.round(bg[1] * (1 - a) + fg[1] * a),
    Math.round(bg[2] * (1 - a) + fg[2] * a),
  ]
}

function makePng(size) {
  const c = size / 2
  const radius = size * 0.219 // Eckenradius des Hintergrunds
  const ringR = size * 0.293 // Mittlerer Radius des Rings
  const ringHalf = size * 0.025 // Halbe Ringdicke
  const dotR = size * 0.105 // Radius des Punkts

  // Rohdaten: pro Zeile 1 Filter-Byte + size*4 RGBA-Bytes.
  const raw = Buffer.alloc((size * 4 + 1) * size)
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // Filter "none"
    for (let x = 0; x < size; x++) {
      // Abgerundetes Rechteck: alpha des Hintergrunds.
      const dx = Math.max(radius - x, x - (size - radius), 0)
      const dy = Math.max(radius - y, y - (size - radius), 0)
      const corner = Math.hypot(dx, dy)
      const bgA = Math.min(Math.max(radius + 0.5 - corner, 0), 1)

      let rgb = BG
      const dist = Math.hypot(x + 0.5 - c, y + 0.5 - c)

      // Ring (weiß), weiche Kanten.
      const ringA = Math.min(Math.max(ringHalf + 0.5 - Math.abs(dist - ringR), 0), 1)
      if (ringA > 0) rgb = blend(rgb, RING, ringA)

      // Punkt in der Mitte.
      const dotA = Math.min(Math.max(dotR + 0.5 - dist, 0), 1)
      if (dotA > 0) rgb = blend(rgb, DOT, dotA)

      raw[p++] = rgb[0]
      raw[p++] = rgb[1]
      raw[p++] = rgb[2]
      raw[p++] = Math.round(bgA * 255)
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const targets = [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['apple-touch-icon.png', 180],
]
for (const [name, size] of targets) {
  writeFileSync(resolve(publicDir, name), makePng(size))
  console.log(`✓ ${name} (${size}×${size})`)
}

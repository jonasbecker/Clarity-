// Text-Extraktion für den Datei-Upload bei Tasks (Übungsblätter etc.).
//
// Unterstützt .txt/.md (direkt) und .pdf (über pdf.js, lokal gebündelt — kein
// CDN, bleibt offline-/PWA-tauglich). Die Datei selbst wird nirgendwo
// gespeichert: nur der extrahierte, gekappte Text geht an die KI-Analyse.

// Token-/Kosten-Schutz: mehr Text bringt der KI nichts, kostet nur Zeit.
export const MAX_CHARS = 6000

const TEXT_TYPES = ['text/plain', 'text/markdown']
const TEXT_EXT = /\.(txt|md)$/i

export function isSupportedFile(file) {
  if (!file) return false
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return true
  if (TEXT_TYPES.includes(file.type) || TEXT_EXT.test(file.name)) return true
  return false
}

// Liest .txt/.md direkt, .pdf über pdf.js. Gibt den (gekappten) Text zurück.
export async function extractText(file) {
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
    return extractPdfText(file)
  }
  const text = await file.text()
  return text.slice(0, MAX_CHARS)
}

async function extractPdfText(file) {
  const [pdfjsLib, workerUrl] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url').then((m) => m.default),
  ])
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    if (text.length >= MAX_CHARS) break
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((it) => it.str).join(' ') + '\n'
  }
  return text.slice(0, MAX_CHARS)
}

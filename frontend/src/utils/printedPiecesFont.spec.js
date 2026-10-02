// AI-GENERATED — not an architecture reference

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { drawGradidoCard } from './gradidoCard'
import { drawThankYouCard } from './thankYouCard'
import { drawCheque } from './thankYouCheque'

// The printed pieces wait for their font before they measure or write a word. A canvas that
// does not have the font yet draws -- and MEASURES -- in the fallback, and paper cannot be
// corrected: until the font shipped with the wallet, the first card of a session came out
// in the device's font and every later one in Open Sans.
//
// Three things are held here, for each of the three drawers:
// - nothing is measured or written until `printFontReady` has resolved
// - every character the piece sets was handed to it (the text decides which subsets of the
//   font are fetched -- a Greek name that is not handed in is drawn in the fallback)
// - a font that cannot be loaded does not cost the member the piece

// The stand-in for printFont.js records what it was asked for and answers as each test says.
const font = vi.hoisted(() => ({ asked: [], answer: null }))
vi.mock('./printFont', () => ({
  printFontReady: (texts) => {
    font.asked.push(texts)
    return font.answer(texts)
  },
}))
vi.mock('./printSheet', () => ({ printSheet: vi.fn() }))
vi.mock('./qrCode', () => ({
  renderQrCodeCanvas: vi.fn(async () => ({ width: 296, height: 296 })),
}))

// There is no canvas in the test environment. This one notes every text it is asked to
// measure or write, in order, and takes everything else without a word.
const recordingContext = () => {
  const texts = []
  const ctx = new Proxy(
    {},
    {
      get: (target, key) => {
        if (key === 'texts') return texts
        if (key === 'measureText') {
          return (text) => {
            texts.push({ call: 'measureText', text: String(text) })
            return { width: String(text).length * 10 }
          }
        }
        if (key === 'fillText') {
          return (text) => {
            texts.push({ call: 'fillText', text: String(text) })
          }
        }
        return key in target ? target[key] : () => {}
      },
      set: (target, key, value) => {
        target[key] = value
        return true
      },
    },
  )
  return ctx
}

// Words from four subsets of the font: Greek, Cyrillic, Latin Extended (Turkish) and Latin.
// Lower-case where the drawer sets capitals, so "as it is set" is not the same as "as it came".
// ⚠️ The hosts are short on purpose. What is compared are characters, and a host like
// `ki-playground.gradido.net` already carries every letter of the fixed `gradido.net` and
// the `u` of `/u/` -- a drawer that forgot to hand in its fixed texts would not be noticed.
const QR = { width: 296, height: 296 }
const PIECES = [
  {
    name: 'the Gradido card',
    mustSet: ['Ελένη Παπαδοπούλου', 'EL', 'gradido.net', '/u/'],
    draw: () =>
      drawGradidoCard({
        qrCanvas: QR,
        name: 'Ελένη Παπαδοπούλου',
        communityLabel: 'Κοινότητα',
        communityName: 'Сообщество Градидо',
        aliasLabel: 'Όνομα',
        alias: 'eleni',
        host: 'x.example',
        initials: 'el',
        contactHeading: 'Επικοινωνία',
        contact: ['Şükrü Çağlar, İstanbul', 'Привет из Киева'],
        slogan: 'Η ευγνωμοσύνη',
      }),
  },
  {
    name: 'the thank-you card',
    mustSet: ['TEŞEKKÜR KARTI', 'Αγορά', 'Сообщество'],
    draw: () =>
      drawThankYouCard({
        url: 'https://gdd.example/dk/ABC',
        label: 'Αγορά',
        community: 'Сообщество',
        title: 'teşekkür kartı',
        slogan: 'Η ευγνωμοσύνη',
      }),
  },
  {
    name: 'the cheque of a member',
    mustSet: ['Ελένη благодарит: 20 Gradido.', 'EL', '/u/', 'eleni'],
    draw: () =>
      drawCheque({
        qrCanvas: QR,
        kind: 'thankYou',
        name: 'Сообщество Градидо',
        initials: 'EL',
        headline: 'Ελένη благодарит: 20 Gradido.',
        // Long enough to be cut after two lines, so the ellipsis is set too.
        memo: Array(40)
          .fill('Για τη βοήθεια στον κήπο. Bahçedeki yardım için teşekkürler.')
          .join(' '),
        hintLine: 'Отсканируй QR-код!',
        validLine: 'Ισχύει έως 16.10.2026',
        host: 'x.example',
        alias: 'eleni',
      }),
  },
  {
    name: 'the starting-bonus cheque',
    mustSet: ['Сообщество Градидо', 'www.gradido.net'],
    draw: () =>
      drawCheque({
        qrCanvas: QR,
        kind: 'startingBonus',
        community: 'Сообщество Градидо',
        headline: 'Startguthaben 100 Gradido',
        memo: 'Για τη βοήθεια στον κήπο',
        hintLine: 'Отсканируй QR-код!',
        validLine: '',
      }),
  },
]

describe.each(PIECES)('$name', ({ draw, mustSet }) => {
  let ctx

  beforeEach(() => {
    font.asked.length = 0
    font.answer = async () => {}
    ctx = recordingContext()
    const original = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return original(tag)
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toDataURL: () => 'data:image/png;base64,piece',
      }
    })
    // jsdom's Image never fires onload, so the draw would wait for its pictures for ever.
    vi.stubGlobal(
      'Image',
      class {
        constructor() {
          this.width = 500
          this.height = 147
        }

        set src(value) {
          this._src = value
          queueMicrotask(() => this.onload?.())
        }

        get src() {
          return this._src
        }
      },
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    delete document.fonts
  })

  it('measures and writes nothing until the font is there', async () => {
    let arrive
    font.answer = () =>
      new Promise((resolve) => {
        arrive = resolve
      })

    let drawn = false
    const drawing = draw().then((picture) => {
      drawn = true
      return picture
    })
    // Long enough for everything else the drawer waits for -- its pictures, the QR code.
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(font.asked).toHaveLength(1)
    expect(ctx.texts).toEqual([])
    expect(drawn).toBe(false)

    arrive()
    await expect(drawing).resolves.toBe('data:image/png;base64,piece')
    expect(ctx.texts.length).toBeGreaterThan(0)
  })

  it('hands in every character it sets, as it is set', async () => {
    await draw()

    expect(font.asked).toHaveLength(1)
    const written = ctx.texts.filter(({ call }) => call === 'fillText').map(({ text }) => text)
    // The fixture is really drawn in full -- otherwise the comparison below says little.
    for (const text of mustSet) expect(written).toContain(text)

    // What printFont.js makes of the list: the texts joined by a space.
    const asked = new Set(font.asked[0].filter((text) => typeof text === 'string').join(' '))
    const missing = [
      ...new Set(ctx.texts.flatMap(({ text }) => [...text]).filter((char) => !asked.has(char))),
    ]
    expect(missing).toEqual([])
  })

  it('is drawn all the same when the font cannot be loaded', async () => {
    const { printFontReady } = await vi.importActual('./printFont')
    const load = vi.fn(() => Promise.reject(new Error('NetworkError')))
    Object.defineProperty(document, 'fonts', { configurable: true, value: { load } })
    font.answer = printFontReady

    await expect(draw()).resolves.toBe('data:image/png;base64,piece')
    expect(load).toHaveBeenCalled()
    expect(ctx.texts.length).toBeGreaterThan(0)
  })
})

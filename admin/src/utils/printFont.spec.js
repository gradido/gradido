// AI-GENERATED — not an architecture reference

import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { printFontReady } from './printFont'

// fileURLToPath is handed the string import.meta.url, never a URL object built here.
// The test environment brings its own URL class, and node rejects an instance of it as
// coming from the wrong realm -- which passes locally and fails in CI.
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

const STYLE = '#print-font-open-sans'

// jsdom has no `document.fonts`. Each test hangs in the one it needs and takes it out again.
const withFonts = (load) =>
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load } })

afterEach(() => {
  delete document.fonts
  document.querySelectorAll(STYLE).forEach((style) => style.remove())
})

// The admin draws the starting-bonus cheque in Open Sans and fetches the font from the
// wallet's root. Its pages do not know the family, so it declares it itself -- with a copy
// of the wallet's declaration, because the two applications share no code. A copy that
// drifts would point at files that are not there, or draw the cheque from other faces than
// the wallet draws its own.
describe('the declaration of Open Sans', () => {
  it('is byte-identical to the wallet copy', () => {
    expect(read('../assets/fonts/open-sans/open-sans.css')).toBe(
      read('../../../frontend/src/assets/fonts/open-sans/open-sans.css'),
    )
  })
})

describe('printFontReady', () => {
  // ⛔ For a family that is not declared, load() answers with an empty list and no error:
  // the cheque would be drawn in the fallback and nobody would notice. So the style has to
  // be in the page at the moment the font is asked for.
  it('declares the family before it waits for it', async () => {
    const seen = []
    withFonts(async () => {
      const style = document.head.querySelector(STYLE)
      seen.push(style ? (style.textContent.match(/@font-face/g) ?? []).length : null)
      return []
    })
    expect(document.querySelector(STYLE)).toBeNull()

    await printFontReady(['Startguthaben'])

    expect(seen).toEqual([40, 40, 40, 40])
  })

  it('declares what the wallet declares, with the addresses of the wallet root', async () => {
    withFonts(async () => [])

    await printFontReady(['Startguthaben'])

    const declared = document.head.querySelector(STYLE).textContent
    expect(declared).toBe(read('../assets/fonts/open-sans/open-sans.css'))
    expect(declared).toContain("url('/fonts/open-sans/open-sans-latin.woff2')")
    expect(declared).not.toContain('/admin/')
  })

  // Two declarations of one family in a page fetch every file twice.
  it('declares it once, however many cheques are drawn', async () => {
    withFonts(async () => [])

    await printFontReady(['one'])
    await printFontReady(['two'])
    await Promise.all([printFontReady(['three']), printFontReady(['four'])])

    expect(document.querySelectorAll(STYLE)).toHaveLength(1)
  })

  // ⛔ The text decides which subsets of the font are fetched.
  it('asks for the four weights with every text', async () => {
    const load = vi.fn(async () => [])
    withFonts(load)

    await printFontReady(['Сообщество', null, '', 'www.gradido.net'])

    expect(load.mock.calls.map(([font]) => font)).toEqual([
      '400 16px "Open Sans"',
      '500 16px "Open Sans"',
      '600 16px "Open Sans"',
      '700 16px "Open Sans"',
    ])
    for (const [, text] of load.mock.calls) expect(text).toBe('Сообщество www.gradido.net')
  })

  // ⛔ One weight failing must not end the wait for the others. `Promise.all` gives up at the
  // first rejection; the drawer would then measure while another weight is still on its way,
  // and the first drawing would again differ from the next.
  it('still waits for the other weights when one cannot be loaded', async () => {
    let arrive
    const slow = new Promise((resolve) => {
      arrive = resolve
    })
    withFonts((font) => (font.startsWith('400') ? slow : Promise.reject(new Error('NetworkError'))))

    let ready = false
    const waiting = printFontReady(['Startguthaben']).then(() => {
      ready = true
    })
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(ready).toBe(false)

    arrive([])
    await expect(waiting).resolves.toBeUndefined()
    expect(ready).toBe(true)
  })

  // A missing file makes load() reject. A cheque in the fallback is better than no cheque.
  it('does not fail when the font cannot be loaded', async () => {
    const load = vi.fn(() => Promise.reject(new Error('NetworkError')))
    withFonts(load)

    await expect(printFontReady(['Startguthaben'])).resolves.toBeUndefined()
    expect(load).toHaveBeenCalled()
  })

  it('does not fail when load() itself throws', async () => {
    withFonts(() => {
      throw new Error('SyntaxError')
    })

    await expect(printFontReady(['Startguthaben'])).resolves.toBeUndefined()
  })

  it('does not fail, and declares nothing, where there is no document.fonts at all', async () => {
    expect(document.fonts).toBeUndefined()

    await expect(printFontReady(['Startguthaben'])).resolves.toBeUndefined()
    expect(document.querySelector(STYLE)).toBeNull()
  })
})

// The cheque's drawer is the wallet's, byte for byte, and what it does about the font is
// tested there (frontend/src/utils/printedPiecesFont.spec.js). What only the admin can show
// is that ITS drawer reaches THIS file: the family is declared, and asked for with the
// cheque's own words, before the first word is measured.
describe('the starting-bonus cheque', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('is measured only after the family is declared and the font was asked for', async () => {
    const { drawCheque } = await import('./thankYouCheque')
    const order = []
    const load = vi.fn(async (font, text) => {
      order.push({ step: 'load', declared: !!document.head.querySelector(STYLE), text })
      return []
    })
    withFonts(load)

    const ctx = new Proxy(
      {},
      {
        get: (target, key) => {
          if (key === 'measureText') {
            return (text) => {
              order.push({ step: 'measureText' })
              return { width: String(text).length * 10 }
            }
          }
          if (key === 'fillText') return () => order.push({ step: 'fillText' })
          return key in target ? target[key] : () => {}
        },
        set: (target, key, value) => {
          target[key] = value
          return true
        },
      },
    )
    const original = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return original(tag)
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toDataURL: () => 'data:image/png;base64,cheque',
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

    await expect(
      drawCheque({
        qrCanvas: { width: 296, height: 296 },
        kind: 'startingBonus',
        community: 'Сообщество Градидо',
        headline: 'Startguthaben 100 Gradido',
        memo: 'Willkommen bei uns',
        hintLine: 'QR-Code scannen!',
        validLine: '',
      }),
    ).resolves.toBe('data:image/png;base64,cheque')

    expect(order.slice(0, 4).map(({ step }) => step)).toEqual(['load', 'load', 'load', 'load'])
    expect(order.slice(0, 4).every(({ declared }) => declared)).toBe(true)
    expect(order[0].text).toContain('Сообщество Градидо')
    expect(order[0].text).toContain('www.gradido.net')
    expect(order.slice(4).some(({ step }) => step === 'measureText')).toBe(true)
  })
})

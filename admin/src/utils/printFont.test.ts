// AI-GENERATED — not an architecture reference

import { afterAll, afterEach, describe, expect, it, mock } from 'bun:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { printFontReady } from './printFont'

const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath: string) => readFileSync(resolve(here, relativePath), 'utf8')

const STYLE = 'print-font-open-sans'

type Load = (font: string, text: string) => Promise<unknown>

// No browser here: a document of the test's own, with as much of one as the file asks for -- the
// styles in its head, and `fonts`, which each test hangs in as it needs it.
const styles: { id: string; textContent: string }[] = []
const canvas: { current?: object } = {}
const page: { fonts?: { load: Load } } & Record<string, unknown> = {
  getElementById: (id: string) => styles.find((style) => style.id === id) ?? null,
  createElement: (tag: string) => (tag === 'canvas' ? canvas.current : { id: '', textContent: '' }),
  head: { appendChild: (style: (typeof styles)[number]) => styles.push(style) },
}
Object.assign(globalThis, { document: page })
// taken out again: a library asked later (sass) takes a `document` for a browser
afterAll(() => {
  Reflect.deleteProperty(globalThis, 'document')
})
const declared = () => styles.filter((style) => style.id === STYLE)
const withFonts = (load: Load) => {
  page.fonts = { load }
}

afterEach(() => {
  delete page.fonts
  styles.length = 0
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
    const seen: (number | null)[] = []
    withFonts(async () => {
      const [style] = declared()
      seen.push(style ? (style.textContent.match(/@font-face/g) ?? []).length : null)
      return []
    })
    expect(declared()).toHaveLength(0)

    await printFontReady(['Startguthaben'])

    expect(seen).toEqual([10, 10, 10])
  })

  it('declares what the wallet declares, with the addresses of the wallet root', async () => {
    withFonts(async () => [])

    await printFontReady(['Startguthaben'])

    const { textContent } = declared()[0]
    expect(textContent).toBe(read('../assets/fonts/open-sans/open-sans.css'))
    expect(textContent).toContain("url('/fonts/open-sans/open-sans-latin.woff2')")
    expect(textContent).not.toContain('/admin/')
  })

  // Two declarations of one family in a page fetch every file twice.
  it('declares it once, however many cheques are drawn', async () => {
    withFonts(async () => [])

    await printFontReady(['one'])
    await printFontReady(['two'])
    await Promise.all([printFontReady(['three']), printFontReady(['four'])])

    expect(declared()).toHaveLength(1)
  })

  // ⛔ The text decides which subsets of the font are fetched.
  it('asks for the three weights with every text', async () => {
    const load = mock<Load>(async () => [])
    withFonts(load)

    await printFontReady(['Сообщество', null, '', 'www.gradido.net'])

    expect(load.mock.calls.map(([font]) => font)).toEqual([
      '400 16px "Open Sans"',
      '600 16px "Open Sans"',
      '700 16px "Open Sans"',
    ])
    for (const [, text] of load.mock.calls) {
      expect(text).toBe('Сообщество www.gradido.net')
    }
  })

  // ⛔ One weight failing must not end the wait for the others. `Promise.all` gives up at the
  // first rejection; the drawer would then measure while another weight is still on its way,
  // and the first drawing would again differ from the next.
  it('still waits for the other weights when one cannot be loaded', async () => {
    const { promise: slow, resolve: arrive } = Promise.withResolvers<unknown>()
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
    const load = mock<Load>(() => Promise.reject(new Error('NetworkError')))
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
    expect(page.fonts).toBeUndefined()

    await expect(printFontReady(['Startguthaben'])).resolves.toBeUndefined()
    expect(declared()).toHaveLength(0)
  })
})

// The cheque's drawer is the wallet's, byte for byte, and what it does about the font is
// tested there (frontend/src/utils/printedPiecesFont.spec.js). What only the admin can show
// is that ITS drawer reaches THIS file: the family is declared, and asked for with the
// cheque's own words, before the first word is measured.
describe('the starting-bonus cheque', () => {
  it('is measured only after the family is declared and the font was asked for', async () => {
    const { drawCheque } = await import('./thankYouCheque')
    const order: { step: string; declared?: boolean; text?: string }[] = []
    withFonts(async (_font, text) => {
      order.push({ step: 'load', declared: declared().length > 0, text })
      return []
    })

    const ctx = new Proxy<Record<string | symbol, unknown>>(
      {},
      {
        get: (target, key) => {
          if (key === 'measureText') {
            return (text: string) => {
              order.push({ step: 'measureText' })
              return { width: String(text).length * 10 }
            }
          }
          if (key === 'fillText') {
            return () => order.push({ step: 'fillText' })
          }
          return key in target ? target[key] : () => undefined
        },
        set: (target, key, value) => {
          target[key] = value
          return true
        },
      },
    )
    canvas.current = {
      width: 0,
      height: 0,
      getContext: () => ctx,
      toDataURL: () => 'data:image/png;base64,cheque',
    }
    // a picture that is there as soon as it is asked for
    Object.assign(globalThis, {
      Image: class {
        width = 500
        height = 147
        onload?: () => void
        #src = ''

        set src(value: string) {
          this.#src = value
          queueMicrotask(() => this.onload?.())
        }

        get src() {
          return this.#src
        }
      },
    })

    await expect(
      drawCheque({
        qrCanvas: { width: 296, height: 296 } as HTMLCanvasElement,
        kind: 'startingBonus',
        community: 'Сообщество Градидо',
        headline: 'Startguthaben 100 Gradido',
        memo: 'Willkommen bei uns',
        hintLine: 'QR-Code scannen!',
        validLine: '',
      }),
    ).resolves.toBe('data:image/png;base64,cheque')

    expect(order.slice(0, 3).map(({ step }) => step)).toEqual(['load', 'load', 'load'])
    expect(order.slice(0, 3).every(({ declared }) => declared)).toBe(true)
    expect(order[0].text).toContain('Сообщество Градидо')
    expect(order[0].text).toContain('www.gradido.net')
    expect(order.slice(3).some(({ step }) => step === 'measureText')).toBe(true)
  })
})

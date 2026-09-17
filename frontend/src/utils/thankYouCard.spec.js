// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest'
import { drawThankYouCard, printThankYouCardSheet, thankYouCardFileName } from './thankYouCard'
import { printSheet } from './printSheet'

vi.mock('./printSheet', () => ({ printSheet: vi.fn() }))
vi.mock('./qrCode', () => ({
  renderQrCodeCanvas: vi.fn(async () => ({ width: 10, height: 10 })),
}))

describe('thankYouCardFileName', () => {
  it('puts the label into the name so a folder sorts by card', () => {
    expect(thankYouCardFileName('Portemonnaie')).toBe('Dank-Karte Portemonnaie.png')
  })

  it('falls back to the bare name when there is no label', () => {
    expect(thankYouCardFileName('')).toBe('Dank-Karte.png')
    expect(thankYouCardFileName(null)).toBe('Dank-Karte.png')
    expect(thankYouCardFileName(undefined)).toBe('Dank-Karte.png')
  })

  // The label is whatever its owner typed, so it reaches this having been checked for
  // nothing. Reusing the cheque's builder is what makes that safe -- these two cases are
  // here to prove the reuse actually happens rather than to re-test its rules.
  it('takes the characters a file name cannot carry out of the label', () => {
    expect(thankYouCardFileName('Karte/2026')).not.toContain('/')
    expect(thankYouCardFileName('a<b>c:d"e|f?g*h')).toMatch(/^Dank-Karte [^<>:"/\\|?*]+\.png$/)
  })

  it('does not let a label end the name in a dot', () => {
    expect(thankYouCardFileName('Auto...')).not.toContain('..png')
  })
})

/**
 * ⛔ The millimetres ARE the feature. Everywhere else a mocked module hides them: the
 * component's spec never runs this file, so breaking `54mm` there stays green. This is the
 * one place the page's own geometry is looked at.
 */
describe('printThankYouCardSheet', () => {
  let ctx

  beforeEach(() => {
    vi.clearAllMocks()
    ctx = new Proxy(
      {},
      {
        get: (target, key) =>
          key === 'measureText' ? () => ({ width: 10 }) : (target[key] ?? (() => {})),
        set: () => true,
      },
    )
    const original = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return original(tag)
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toDataURL: () => 'data:image/png;base64,card',
      }
    })

    // The logo is loaded through an Image whose onload never fires in jsdom, so the draw
    // would wait forever. Same stand-in the business card's spec uses.
    vi.stubGlobal(
      'Image',
      class {
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

  const sheet = async () => {
    await printThankYouCardSheet({
      url: 'https://example.org/dk/DK-abc',
      label: 'Portemonnaie',
      community: 'Gradido',
      title: 'Dank-Karte',
    })
    return vi.mocked(printSheet).mock.calls[0][0]
  }

  it('lays the card out at its real size on an A4 page', async () => {
    const { style } = await sheet()

    expect(style).toContain('size: A4')
    expect(style).toContain('width: 54mm')
    expect(style).toContain('height: 85.6mm')
    expect(style).toContain('width: 210mm')
    expect(style).toContain('height: 297mm')
  })

  // ⛔ One, and the whole reason for this way out: every copy carries the same code, so a
  // page full of them is a page full of the same bearer token — and a missing one among
  // nine looks like one that was put somewhere.
  it('puts exactly one card on the page', async () => {
    const { build } = await sheet()
    const doc = document.implementation.createHTMLDocument('')

    build(doc)

    expect(doc.querySelectorAll('img')).toHaveLength(1)
    expect(doc.querySelector('img').src).toBe('data:image/png;base64,card')
  })

  // Otherwise the card sits at the very edge, where most home printers cannot print.
  it('keeps the card away from the unprintable edge', async () => {
    const { style } = await sheet()

    expect(style).toContain('padding: 20mm')
  })
})

describe('drawThankYouCard', () => {
  let ctx
  let createElement

  // The same idea as the business card's spec: no canvas here, so the calls are recorded with
  // the fill colour and font in force when they happened, and text measures half its font size
  // per character.
  const recordingContext = () => {
    const calls = []
    const recording = {
      fillStyle: '',
      strokeStyle: '',
      font: '',
      lineWidth: 0,
      textAlign: 'left',
      measureText: (text) => ({
        width: String(text).length * 0.5 * (Number(/(\d+)px/.exec(recording.font)?.[1]) || 20),
      }),
    }
    for (const name of ['fillRect', 'fillText', 'drawImage', 'strokeRect']) {
      recording[name] = (...args) =>
        calls.push({ name, args, fillStyle: recording.fillStyle, font: recording.font })
    }
    recording.calls = calls
    return recording
  }

  const mm = (value) => Math.round((value * 300) / 25.4)

  const OPTIONS = {
    url: 'https://example.org/dk/DK-abc',
    label: 'Portemonnaie',
    community: 'KI Playground',
    title: 'Dank-Karte',
  }
  const SLOGAN = 'Helfen. Schenken. Danken.'

  // fillRect number 0 is the white background, 1 and 2 are the gold lines.
  const rulesTop = () => ctx.calls.filter((call) => call.name === 'fillRect')[1].args[1]
  const textDraw = (text) =>
    ctx.calls.find((call) => call.name === 'fillText' && call.args[0] === text)
  const textsIn = (recording) =>
    recording.calls.filter((call) => call.name === 'fillText').map((call) => call.args[0])
  const sizeOf = (call) => Number(/(\d+)px/.exec(call.font)[1])
  const qrDraw = () =>
    ctx.calls.find((call) => call.name === 'drawImage' && call.args[0].width === 10)

  beforeEach(() => {
    vi.clearAllMocks()
    ctx = recordingContext()
    const original = document.createElement.bind(document)
    createElement = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return original(tag)
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toDataURL: () => 'data:image/png;base64,card',
      }
    })
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
    createElement.mockRestore()
    vi.unstubAllGlobals()
  })

  it('draws the head as before when there is no slogan', async () => {
    await drawThankYouCard(OPTIONS)

    // 5 mm margin, 6 mm logo, 4 mm air
    expect(rulesTop()).toBe(mm(5) + mm(6) + mm(4))
    expect(textsIn(ctx)).not.toContain(SLOGAN)
  })

  // Version D1 of the mockup (Bernd, 17.09.2026): the slogan under the logo, and everything from
  // the gold lines down moves lower by its line.
  describe('with the slogan', () => {
    it('sets it under the logo, centred, in the green and the size it has on the business card', async () => {
      await drawThankYouCard({ ...OPTIONS, slogan: SLOGAN })

      const slogan = textDraw(SLOGAN)
      expect(slogan.fillStyle).toBe('#4a6741')
      expect(sizeOf(slogan)).toBe(mm(2.1))
      expect(slogan.args[1]).toBe(Math.round(mm(54) / 2))
      // 1.2 mm under the 6 mm logo, measured to the top of the capitals and ascenders
      expect(slogan.args[2]).toBe(mm(5) + mm(6) + mm(1.2) + Math.round(mm(2.1) * 0.76))
      expect(rulesTop()).toBeGreaterThan(slogan.args[2])
    })

    it('moves gold lines, title and label down by the same distance and leaves the code alone', async () => {
      await drawThankYouCard(OPTIONS)
      const before = {
        rules: rulesTop(),
        title: textDraw('DANK-KARTE').args[2],
        label: textDraw('Portemonnaie').args[2],
        qr: qrDraw().args[2],
      }

      ctx = recordingContext()
      await drawThankYouCard({ ...OPTIONS, slogan: SLOGAN })

      const shift = rulesTop() - before.rules
      // 2.3 mm on paper
      expect(shift).toBe(27)
      expect(textDraw('DANK-KARTE').args[2] - before.title).toBe(shift)
      expect(textDraw('Portemonnaie').args[2] - before.label).toBe(shift)
      expect(qrDraw().args[2]).toBe(before.qr)
    })
  })

  /**
   * The title's translations do not all fit the 44 mm the gold lines are long -- Spanish ran to
   * 49.4 mm -- so it shrinks until it stands inside them with a millimetre to spare either side
   * (Bernd, 17.09.2026). The room here: 638 wide, 59 margin twice, 12 inset twice = 496.
   */
  describe('the title between the gold lines', () => {
    const ROOM = mm(54) - 2 * mm(5) - 2 * mm(1)
    const widthOf = (call) => String(call.args[0]).length * 0.5 * sizeOf(call)

    it('leaves a title that fits at its full size', async () => {
      await drawThankYouCard(OPTIONS)

      expect(sizeOf(textDraw('DANK-KARTE'))).toBe(mm(3.4))
    })

    it('shrinks a title wider than the lines until it stands inside them', async () => {
      const title = 'x'.repeat(26)
      await drawThankYouCard({ ...OPTIONS, title })

      const call = textDraw(title.toUpperCase())
      expect(sizeOf(call)).toBeLessThan(mm(3.4))
      expect(widthOf(call)).toBeLessThanOrEqual(ROOM)
    })

    // The community line under the code is the smallest type on the card.
    it('never shrinks it below the community line', async () => {
      const title = 'x'.repeat(100)
      await drawThankYouCard({ ...OPTIONS, title })

      expect(sizeOf(textDraw(title.toUpperCase()))).toBe(mm(2.6))
    })

    // A title that had to shrink keeps its capitals centred between the lines, rather than
    // sitting on the baseline of the full size with the air all above it.
    it('keeps a smaller title centred between the lines', async () => {
      const capCentre = (call) => call.args[2] - (sizeOf(call) * 0.714) / 2

      await drawThankYouCard(OPTIONS)
      const full = capCentre(textDraw('DANK-KARTE'))

      ctx = recordingContext()
      const title = 'x'.repeat(40)
      await drawThankYouCard({ ...OPTIONS, title })

      expect(Math.abs(capCentre(textDraw(title.toUpperCase())) - full)).toBeLessThanOrEqual(1)
    })
  })
})

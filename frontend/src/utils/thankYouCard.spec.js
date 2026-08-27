// AI-GENERATED — not an architecture reference
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { printThankYouCardSheet, thankYouCardFileName } from './thankYouCard'
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

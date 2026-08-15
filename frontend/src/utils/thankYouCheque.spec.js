// AI-GENERATED — not an architecture reference

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { avatarPaletteEntry } from './avatarColor'
import { chequeFileName, drawCheque, wrapText } from './thankYouCheque'

// There is no canvas in the test environment. `wrapText` only needs measureText,
// mocked here with a fixed character width so the line breaks are predictable.
const ctxWithCharWidth = (width) => ({
  measureText: (text) => ({ width: text.length * width }),
})

describe('chequeFileName', () => {
  it('takes the occasion and puts the amount first', () => {
    expect(chequeFileName('Gradido-Café Berlin', '20')).toBe('20 GDD - Gradido-Café Berlin.png')
  })

  it('keeps hyphens so that "Dank-Scheck" stays "Dank-Scheck"', () => {
    expect(chequeFileName('Dank-Scheck Nr. 012', '5')).toBe('5 GDD - Dank-Scheck Nr. 012.png')
  })

  it('replaces characters Windows forbids in file names', () => {
    const name = chequeFileName('Café um 12:00 / Saal <A> "groß" | Nr?*', '20')
    expect(name).not.toMatch(/[<>:"/\\|?*]/)
    expect(name.endsWith('.png')).toBe(true)
  })

  it('truncates long names at a word boundary, not mid-word', () => {
    const occasion = 'Vortrag Nürtingen, Donnerstag 16. August, Stadthalle Süd, Eingang West'
    const name = chequeFileName(occasion, '20')
    const core = name.replace(/^20 GDD - /, '').replace(/\.png$/, '')
    expect(core.length).toBeLessThanOrEqual(50)
    expect(core).not.toMatch(/\s$/)
    // whole words only, no dangling fragment at the end
    expect(occasion).toContain(core)
  })

  it('never ends on a dot or a space — Windows rejects such names', () => {
    expect(chequeFileName('Bis später...', '3')).toBe('3 GDD - Bis später.png')
    expect(chequeFileName('Danke   ', '3')).toBe('3 GDD - Danke.png')
  })

  it('falls back to a fixed name when the occasion is empty', () => {
    expect(chequeFileName('', '10')).toBe('10 GDD - Gradido-Scheck.png')
    expect(chequeFileName(null, '10')).toBe('10 GDD - Gradido-Scheck.png')
  })

  it('avoids the names Windows reserves', () => {
    expect(chequeFileName('nul', '1')).toBe('1 GDD - Gradido-Scheck.png')
    expect(chequeFileName('COM1', '1')).toBe('1 GDD - Gradido-Scheck.png')
  })

  it('leaves out the amount when none is given', () => {
    expect(chequeFileName('Gradido-Café', null)).toBe('Gradido-Café.png')
  })
})

describe('wrapText', () => {
  const ctx = ctxWithCharWidth(10)

  it('returns no line for empty text', () => {
    expect(wrapText(ctx, '', 100)).toEqual([])
    expect(wrapText(ctx, null, 100)).toEqual([])
  })

  it('keeps short text on one line', () => {
    expect(wrapText(ctx, 'kurz', 100)).toEqual(['kurz'])
  })

  it('breaks at word boundaries', () => {
    expect(wrapText(ctx, 'eins zwei drei', 100)).toEqual(['eins zwei', 'drei'])
  })

  it('truncates after the allowed number of lines and adds an ellipsis', () => {
    const lines = wrapText(ctx, 'eins zwei drei vier fünf sechs sieben', 100, 2)
    expect(lines).toHaveLength(2)
    expect(lines[1].endsWith('…')).toBe(true)
  })

  it('does not truncate when the text fits anyway', () => {
    const lines = wrapText(ctx, 'eins zwei', 100, 2)
    expect(lines).toEqual(['eins zwei'])
    expect(lines.join('')).not.toContain('…')
  })

  it('keeps a single overlong word instead of losing it', () => {
    expect(wrapText(ctx, 'Donaudampfschifffahrtsgesellschaft', 50)).toEqual([
      'Donaudampfschifffahrtsgesellschaft',
    ])
  })
})

// There is no canvas in the test environment, so one is recorded instead of drawn. Every
// call keeps the fill colour that was set when it happened -- otherwise a test could only
// see that something was painted, not what.
const recordingContext = () => {
  const calls = []
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    font: '',
    lineWidth: 0,
    textAlign: 'left',
    textBaseline: 'alphabetic',
    measureText: (text) => ({ width: String(text).length * 10 }),
  }
  const record =
    (name) =>
    (...args) => {
      calls.push({ name, args, fillStyle: ctx.fillStyle, font: ctx.font })
    }
  for (const name of [
    'fillRect',
    'fillText',
    'drawImage',
    'beginPath',
    'arc',
    'rect',
    'fill',
    'clip',
    'save',
    'restore',
    'strokeRect',
  ]) {
    ctx[name] = record(name)
  }
  ctx.calls = calls
  return ctx
}

const CHEQUE = {
  qrCanvas: { width: 360, isTheQr: true },
  kind: 'thankYou',
  name: 'Bernd Hückstädt',
  initials: 'BH',
  headline: 'Bernd sends you 20 Gradido.',
  memo: 'Thank you for the evening',
  hintLine: 'Scan the QR code!',
  validLine: 'Valid until 26.08.2026.',
  host: 'ki-playground.gradido.net',
  alias: 'bernd',
}

describe('drawCheque', () => {
  let ctx
  let createElement

  beforeEach(() => {
    ctx = recordingContext()
    const original = document.createElement.bind(document)
    createElement = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return original(tag)
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toDataURL: () => 'data:image/png;base64,cheque',
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

  const texts = () => ctx.calls.filter((c) => c.name === 'fillText').map((c) => c.args[0])

  // The address moved out of the header, because in its durable form it is half again as
  // long and would crowd it.
  it('keeps the header to the name and drops the address from it', async () => {
    await drawCheque(CHEQUE)

    expect(texts()).toContain('Bernd Hückstädt')
    expect(texts()).not.toContain('ki-playground.gradido.net/u/bernd')
  })

  // In three weights, exactly as the card prints it: the part somebody has to read off the
  // paper and type is the part that stands out.
  it('prints the address at the bottom, the user name in bold', async () => {
    await drawCheque(CHEQUE)

    const drawn = texts()
    expect(drawn).toContain('ki-playground.gradido.net')
    expect(drawn).toContain('/u/')
    expect(drawn).not.toContain('www.gradido.net')

    const alias = ctx.calls.find((c) => c.name === 'fillText' && c.args[0] === 'bernd')
    expect(alias.font).toContain('700')
    const host = ctx.calls.find(
      (c) => c.name === 'fillText' && c.args[0] === 'ki-playground.gradido.net',
    )
    expect(host.font).toContain('400')
  })

  // A starting bonus has no member behind it, so there is no personal address to print.
  it('keeps the web address on a cheque without a sender', async () => {
    await drawCheque({ ...CHEQUE, kind: 'startingBonus', community: 'KI Playground', alias: null })

    expect(texts()).toContain('www.gradido.net')
  })

  it('uses the wallet palette for the initials, not a colour of its own', async () => {
    await drawCheque(CHEQUE)

    const initials = ctx.calls.find((c) => c.name === 'fillText' && c.args[0] === 'BH')
    expect(initials.fillStyle).toBe(avatarPaletteEntry('BH').text)
    const disc = ctx.calls.find((c) => c.name === 'fill')
    expect(disc.fillStyle).toBe(avatarPaletteEntry('BH').bg)
  })

  it('draws the picture instead of the initials when there is one', async () => {
    await drawCheque({ ...CHEQUE, portrait: 'data:image/jpeg;base64,portrait' })

    expect(texts()).not.toContain('BH')
    expect(ctx.calls.some((c) => c.name === 'clip')).toBe(true)
  })
})

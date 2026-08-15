// AI-GENERATED — not an architecture reference

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { avatarPaletteEntry } from './avatarColor'
import { cardFileName, drawGradidoCard } from './gradidoCard'

// There is no canvas in the test environment, so one is recorded instead of drawn. Every
// call keeps the fill colour and the font that were set when it happened -- otherwise a
// test could only see that something was painted, not what.
const recordingContext = () => {
  const calls = []
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    font: '',
    lineWidth: 0,
    textAlign: 'left',
    textBaseline: 'alphabetic',
    imageSmoothingEnabled: true,
    // The width has to follow the font size, or no test could see the address line shrink to
    // fit: it would measure the same however small the type got, and the loop that shrinks it
    // would look like it did nothing. Half the size per character is close enough to the real
    // thing -- checked against a browser canvas, both land on the same size for the longest
    // address the system can produce.
    measureText: (text) => ({
      width: String(text).length * 0.5 * (Number(/(\d+)px/.exec(ctx.font)?.[1]) || 20),
    }),
  }
  const record =
    (name) =>
    (...args) => {
      calls.push({
        name,
        args,
        fillStyle: ctx.fillStyle,
        font: ctx.font,
        smoothing: ctx.imageSmoothingEnabled,
      })
    }
  for (const name of [
    'fillRect',
    'fillText',
    'drawImage',
    'beginPath',
    'arc',
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

const textsDrawn = (ctx) =>
  ctx.calls.filter((call) => call.name === 'fillText').map((c) => c.args[0])

const CARD = {
  qrCanvas: { width: 296, height: 296, isTheQr: true },
  name: 'Bernd Hückstädt',
  communityLabel: 'Gemeinschaft',
  communityName: 'KI Playground',
  aliasLabel: 'Benutzername',
  alias: 'bernd',
  host: 'ki-playground.gradido.net',
  initials: 'BH',
}

describe('cardFileName', () => {
  it('leads with the member name', () => {
    expect(cardFileName('Bernd Hückstädt')).toBe('Gradido Bernd Hückstädt.png')
  })

  it('stays a usable file name without a name', () => {
    expect(cardFileName('')).toBe('Gradido.png')
    expect(cardFileName(null)).toBe('Gradido.png')
  })

  it('replaces characters Windows forbids in file names', () => {
    const name = cardFileName('Anna / Berlin <2026>')
    expect(name).not.toMatch(/[<>:"/\\|?*]/)
    expect(name.endsWith('.png')).toBe(true)
  })
})

describe('drawGradidoCard', () => {
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

  it('returns the card as a PNG', async () => {
    await expect(drawGradidoCard(CARD)).resolves.toBe('data:image/png;base64,card')
  })

  it('prints the name and both labelled lines', async () => {
    await drawGradidoCard(CARD)

    const texts = textsDrawn(ctx)
    expect(texts).toContain('Bernd Hückstädt')
    expect(texts).toContain('Gemeinschaft')
    expect(texts).toContain('KI Playground')
    expect(texts).toContain('Benutzername')
    expect(texts).toContain('bernd')
  })

  // The community and the user name are the two inputs of the send form. Printing them is
  // what makes the card usable before the address route exists, so they are not decoration
  // and a later tidy-up must not drop them.
  it('prints the address as host, namespace and alias', async () => {
    await drawGradidoCard(CARD)

    const texts = textsDrawn(ctx)
    expect(texts).toContain('ki-playground.gradido.net')
    expect(texts).toContain('/u/')
  })

  // The card is 85.6 mm wide with 3.2 mm of padding, so 79.2 mm are available. Nothing about
  // the address is ours to choose -- the host can be long, and an account from before the
  // user name became compulsory carries a 36-character Gradido ID where a name would stand.
  // Drawn at a fixed size it ran off the card, and a cut address is a wrong address.
  describe('the address line fits the card', () => {
    // The address is the last thing written on the card, in three pieces. Looking it up by
    // its text would find the wrong one: the alias is printed twice, once in the labelled
    // "user name" line above and once down here, and the two are drawn at different sizes.
    const addressParts = () => ctx.calls.filter((call) => call.name === 'fillText').slice(-3)

    const sizeOfAddress = () => Number(/(\d+)px/.exec(addressParts()[0].font)[1])

    const widthOfAddress = () =>
      addressParts().reduce(
        (sum, call) =>
          sum + String(call.args[0]).length * 0.5 * Number(/(\d+)px/.exec(call.font)[1]),
        0,
      )

    const baselineOfAddress = () => addressParts()[0].args[2]

    it('leaves an ordinary address at full size', async () => {
      await drawGradidoCard(CARD)

      expect(sizeOfAddress()).toBe(34)
      expect(widthOfAddress()).toBeLessThanOrEqual(935)
    })

    it('shrinks a Gradido ID until it fits instead of cutting it off', async () => {
      await drawGradidoCard({ ...CARD, alias: '8f3a1c7e-42b9-4d61-9c07-1e5a2b8d3f40' })

      expect(sizeOfAddress()).toBeLessThan(34)
      expect(widthOfAddress()).toBeLessThanOrEqual(935)
    })

    // Aliases are capped at 20 characters (VALID_ALIAS_REGEX), so this is the longest line a
    // real community can produce -- and it still has to fit.
    it('fits the longest address the rules allow', async () => {
      const host = 'gradido-lieblingsstadt-oberhausen-rheinhausen.de'
      const alias = 'MariaMagdalenaSchmid'

      await drawGradidoCard({ ...CARD, host, alias })

      expect(widthOfAddress()).toBeLessThanOrEqual(935)
    })

    // The floor keeps an absurd host from shrinking the line to nothing. Below it the address
    // would be on the card but no longer readable, which helps nobody.
    it('never shrinks below the readable floor', async () => {
      const host = `${'x'.repeat(200)}.example.org`

      await drawGradidoCard({ ...CARD, host })

      expect(sizeOfAddress()).toBe(24)
    })

    it('keeps the row where it is when the line shrinks', async () => {
      await drawGradidoCard(CARD)
      const baselineFull = baselineOfAddress()

      ctx.calls.length = 0
      await drawGradidoCard({ ...CARD, alias: '8f3a1c7e-42b9-4d61-9c07-1e5a2b8d3f40' })

      expect(baselineOfAddress()).toBe(baselineFull)
    })
  })

  it('places the QR that was handed in, rather than building one', async () => {
    await drawGradidoCard(CARD)

    const drawn = ctx.calls.filter((call) => call.name === 'drawImage').map((call) => call.args[0])
    expect(drawn).toContain(CARD.qrCanvas)
  })

  // The code is 296 pixels wide and is drawn at 331. Smoothed, every module edge would be
  // blurred, and a scanner reads soft edges worse than hard ones.
  it('draws the QR without smoothing, and leaves the setting as it found it', async () => {
    ctx.imageSmoothingEnabled = true

    await drawGradidoCard(CARD)

    const qrDraw = ctx.calls.find(
      (call) => call.name === 'drawImage' && call.args[0] === CARD.qrCanvas,
    )
    expect(qrDraw.smoothing).toBe(false)
    expect(ctx.imageSmoothingEnabled).toBe(true)
  })

  // Bernd's correction: on paper an empty avatar must not look like a gap. Everywhere in the
  // wallet a member without a picture gets the initials disc, and the card follows.
  it('draws the initials disc in the wallet colour when there is no picture', async () => {
    await drawGradidoCard(CARD)

    const initials = ctx.calls.find((call) => call.name === 'fillText' && call.args[0] === 'BH')
    expect(initials).toBeDefined()
    expect(initials.fillStyle).toBe(avatarPaletteEntry('BH').text)

    const disc = ctx.calls.find((call) => call.name === 'fill')
    expect(disc.fillStyle).toBe(avatarPaletteEntry('BH').bg)
  })

  it('draws the picture instead of the initials, clipped to a circle', async () => {
    await drawGradidoCard({ ...CARD, picture: 'data:image/jpeg;base64,portrait' })

    expect(textsDrawn(ctx)).not.toContain('BH')
    const arc = ctx.calls.findIndex((call) => call.name === 'arc')
    expect(arc).toBeGreaterThan(-1)
    expect(ctx.calls[arc + 1].name).toBe('clip')
    expect(ctx.calls[arc + 2].name).toBe('drawImage')
  })
})

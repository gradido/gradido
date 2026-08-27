// AI-GENERATED — not an architecture reference

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { avatarPaletteEntry } from './avatarColor'
import {
  CONTACT_MAX_LINES,
  QR_SOURCE_CELL,
  cardFileName,
  contactLines,
  drawGradidoCard,
  qrSizeFor,
} from './gradidoCard'
import { qrCodeOptions } from './qrCode'

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

// The same conversion the card draws with, so a measurement here can be written in
// millimetres instead of in pixels nobody can check.
const mm = (value) => Math.round((value * 300) / 25.4)

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

  /**
   * The name was the one piece of text on the card without a rule of its own: fixed size, no
   * clip, so a long one ran into the logo and then over the edge. Paper cannot be corrected.
   *
   * The numbers below are the recording context's, which measures half the font size per
   * character. What was measured in a real browser with Open Sans loaded is the ORDER of the
   * cases -- a 29-character name already touching the logo, a 39-character one 255 px past
   * the card -- and that is what these stand in for.
   */
  describe('the name fits beside the logo', () => {
    // The name is the first text written on the card, and the only one at 700 weight up here.
    const nameDraw = () => ctx.calls.find((call) => call.name === 'fillText')
    const sizeOfName = () => Number(/(\d+)px/.exec(nameDraw().font)[1])
    // 1011 wide, 38 padding either side, and the logo is 500 x 147 drawn 52 high: 177 across.
    // What is left, less the 14 of air: 744.
    const ROOM = 744
    const widthOfName = () => String(nameDraw().args[0]).length * 0.5 * sizeOfName()

    it('leaves an ordinary name at full size', async () => {
      await drawGradidoCard(CARD)

      expect(sizeOfName()).toBe(47)
      expect(widthOfName()).toBeLessThanOrEqual(ROOM)
    })

    it('shrinks a long name until it fits instead of running off the card', async () => {
      await drawGradidoCard({ ...CARD, name: 'Maximiliane von Sonnenberg-Hohenzollern' })

      expect(sizeOfName()).toBeLessThan(47)
      expect(widthOfName()).toBeLessThanOrEqual(ROOM)
    })

    // Reachable since the card can be printed without the real name: a stored user name of
    // one or two characters predates the rule and falls back to the Gradido ID.
    it('shrinks a Gradido ID standing in for a name', async () => {
      await drawGradidoCard({ ...CARD, name: '8f3a1c7e-42b9-4d61-9c07-1e5a2b8d3f40' })

      expect(sizeOfName()).toBeLessThan(47)
      expect(widthOfName()).toBeLessThanOrEqual(ROOM)
    })

    // ⛔ The floor is the size of the community line beneath it. Below that the name stops
    // reading as the heading of the card, and too small to read helps nobody either.
    it('never shrinks below the line underneath it', async () => {
      await drawGradidoCard({ ...CARD, name: 'x'.repeat(300) })

      expect(sizeOfName()).toBe(33)
    })

    // The same rule the address line follows: a line that had to shrink fills less of its
    // row, it does not move it.
    /**
     * ⛔ The floor is a hard stop, so a name past about 42 characters is still too wide --
     * and the name is painted AFTER the logo now, because the room it may use is what the
     * logo does not take. Without a clip it would run straight across the brand mark and off
     * the card. Shrinking is the rule, the clip is the backstop; neither alone covers it.
     */
    it('clips a name the floor cannot save, so nothing paints over the logo', async () => {
      await drawGradidoCard({ ...CARD, name: 'x'.repeat(300) })

      const nameAt = ctx.calls.findIndex((call) => call.name === 'fillText')
      const before = ctx.calls.slice(0, nameAt).map((call) => call.name)

      expect(before.slice(-3)).toEqual(['beginPath', 'rect', 'clip'])
      expect(ctx.calls[nameAt + 1].name).toBe('restore')

      // The clip is the room beside the logo: 1011 wide, 38 padding either side, a logo of
      // 500 x 147 drawn 52 high (177 across), less 14 of air.
      const clipBox = ctx.calls[nameAt - 2].args
      expect(clipBox[0]).toBe(38)
      expect(clipBox[2]).toBeCloseTo(744, 0)
    })

    it('keeps the row where it is when the name shrinks', async () => {
      await drawGradidoCard(CARD)
      const baselineFull = nameDraw().args[2]

      ctx = recordingContext()
      await drawGradidoCard({ ...CARD, name: 'Maximiliane von Sonnenberg-Hohenzollern' })

      expect(nameDraw().args[2]).toBe(baselineFull)
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

  // The lines the member types are the only thing on the card whose content we do not
  // know. They sit in the column between the picture and the QR, under one heading.
  describe('the contact lines', () => {
    it('prints the heading and every line', async () => {
      await drawGradidoCard({
        ...CARD,
        contactHeading: 'Kontakt',
        contact: ['bernd@gradido.net', '+49 7071 123456'],
      })

      const texts = textsDrawn(ctx)
      expect(texts).toContain('Kontakt')
      expect(texts).toContain('bernd@gradido.net')
      expect(texts).toContain('+49 7071 123456')
    })

    // With five full lines the word is in the way rather than an invitation, so it can be
    // left off -- and then the lines take its place instead of leaving a gap where it stood.
    it('leaves the heading out when there is none, and moves the lines up', async () => {
      const baselineOfFirstLine = () =>
        ctx.calls.find((call) => call.name === 'fillText' && call.args[0] === 'first').args[2]

      await drawGradidoCard({ ...CARD, contactHeading: 'Kontakt', contact: ['first', 'second'] })
      const withHeading = baselineOfFirstLine()

      ctx = recordingContext()
      await drawGradidoCard({ ...CARD, contactHeading: '', contact: ['first', 'second'] })

      expect(textsDrawn(ctx)).not.toContain('Kontakt')
      // The block stays centred in its column, so the lines move up into the space the word
      // had rather than leaving a gap where it stood. (Written the other way round first --
      // the measurement was right and the expectation backwards.)
      expect(baselineOfFirstLine()).toBeLessThan(withHeading)
    })

    it('prints nothing where there is nothing, not even the heading', async () => {
      await drawGradidoCard({ ...CARD, contactHeading: 'Kontakt', contact: [] })

      expect(textsDrawn(ctx)).not.toContain('Kontakt')
    })

    // Emptiness is dropped here rather than trusted to the caller, so a stray newline at
    // the end of the field cannot print a gap between two lines.
    it('drops empty lines and keeps the order', async () => {
      await drawGradidoCard({
        ...CARD,
        contact: ['  ', 'first', '', '  second  '],
      })

      const texts = textsDrawn(ctx)
      expect(texts).toContain('first')
      expect(texts).toContain('second')
      expect(texts.indexOf('first')).toBeLessThan(texts.indexOf('second'))
    })

    // Five is what still looks calm on a card, and the field says so. Anything beyond is
    // dropped here as well: a pasted address book must not push the block past the QR.
    it('never prints more than the limit', async () => {
      const many = Array.from({ length: CONTACT_MAX_LINES + 4 }, (_, i) => `line-${i}`)

      await drawGradidoCard({ ...CARD, contact: many })

      const printed = textsDrawn(ctx).filter((text) => String(text).startsWith('line-'))
      expect(printed).toHaveLength(CONTACT_MAX_LINES)
      expect(printed).not.toContain(`line-${CONTACT_MAX_LINES}`)
    })

    it('keeps the same shape when asked directly', () => {
      expect(contactLines(['a', '', '  ', 'b'])).toEqual(['a', 'b'])
      expect(contactLines(null)).toEqual([])
      expect(contactLines(Array.from({ length: 20 }, () => 'x'))).toHaveLength(CONTACT_MAX_LINES)
    })

    // Same reasoning as the address line: a cut contact line is a wrong one, and paper
    // cannot be corrected. So it shrinks instead.
    it('shrinks a long line instead of letting it run into the QR', async () => {
      const sizeOf = (text) =>
        Number(
          /(\d+)px/.exec(
            ctx.calls.find((call) => call.name === 'fillText' && call.args[0] === text).font,
          )[1],
        )

      await drawGradidoCard({ ...CARD, contact: ['short@x.de'] })
      const small = sizeOf('short@x.de')

      ctx = recordingContext()
      const long = `${'x'.repeat(60)}@example.org`
      await drawGradidoCard({ ...CARD, contact: [long] })

      expect(sizeOf(long)).toBeLessThan(small)
    })

    // The clip is what stands between a very long line and the QR. Without it the shrinking
    // above would run out at its floor and paint over the code.
    //
    // Asked for by its own rectangle rather than by "somebody clipped something": the picture
    // clips too, a round window for the photo, and a card drawn with one would let a weaker
    // test pass even with this clip gone. This fixture has no picture -- but the next one
    // might, and then the test would be measuring the wrong thing without saying so.
    it('clips the column so nothing can paint over the QR', async () => {
      await drawGradidoCard({ ...CARD, contact: ['anything'] })

      // ⚠️ The LAST rect, not the first: since the name is clipped to its own room too, the
      // first one belongs to the heading at the top of the card.
      const rect = ctx.calls.findLastIndex((call) => call.name === 'rect')
      expect(rect).toBeGreaterThanOrEqual(0)

      const clip = ctx.calls.findIndex((call, index) => index > rect && call.name === 'clip')
      expect(clip).toBeGreaterThan(rect)

      // The rectangle is the free column: it starts behind the picture and ends before the QR.
      const [left, , width] = ctx.calls[rect].args
      const qr = ctx.calls.find((call) => call.name === 'drawImage' && call.args[0].isTheQr)
      expect(left).toBeGreaterThan(mm(20))
      expect(left + width).toBeLessThanOrEqual(qr.args[1])
    })
  })

  // What decides whether a code can be read is the edge length of one module, and the
  // number of modules follows the address. A fixed width would therefore give one member
  // 0.73 mm per module and another 0.49.
  describe('the QR size follows the address', () => {
    const qrDrawn = () =>
      ctx.calls.find((call) => call.name === 'drawImage' && call.args[0].isTheQr)

    it('draws a short address at its own size, without scaling it', async () => {
      // 33 modules across: 33 * 8 = 264 source pixels
      await drawGradidoCard({ ...CARD, qrCanvas: { width: 264, height: 264, isTheQr: true } })

      expect(qrDrawn().args[3]).toBe(264)
    })

    it('caps the longest addresses at the width that was tested on paper', async () => {
      // 49 modules across would want 392 pixels; 28 mm at 300 dpi are 331
      await drawGradidoCard({ ...CARD, qrCanvas: { width: 392, height: 392, isTheQr: true } })

      expect(qrDrawn().args[3]).toBe(331)
      expect(qrSizeFor({ width: 392 })).toBeLessThan(392)
    })

    // Smoothing off is only safe because the code is not scaled up: source and destination
    // module edges fall on each other, so nearest-neighbour has nothing to choose.
    it('draws the code without smoothing', async () => {
      await drawGradidoCard(CARD)

      expect(qrDrawn().smoothing).toBe(false)
    })

    // qrSizeFor divides the canvas width by the generator's cell size to count the modules.
    // If the generator ever draws with a different one, every size here is wrong -- so the
    // number is held against the generator itself rather than copied and hoped for.
    it('counts modules with the cell size the generator actually uses', () => {
      expect(qrCodeOptions('https://example.org', null).cellSize).toBe(QR_SOURCE_CELL)
    })
  })

  /**
   * A card handed to strangers need not carry its owner's real name (Bernd, 27.08.2026).
   * The caller then puts the alias where the name stood and asks for the labelled line
   * below to be left off -- otherwise the same word would stand twice, two lines apart.
   */
  describe('without the user-name line', () => {
    // What the composable hands in for that case: the alias as the name, no labelled line,
    // the disc lettered from the alias and still coloured from the real initials.
    const QUIET = { ...CARD, name: 'bernd', showAliasLine: false, initials: 'BE', colorSeed: 'BH' }

    // The picture and the code are both centred in the band between the labelled lines and
    // the address, so either of them tells where that band sits.
    const pictureCentre = () => ctx.calls.find((call) => call.name === 'arc').args[1]
    const qrDraw = () =>
      ctx.calls.find((call) => call.name === 'drawImage' && call.args[0] === CARD.qrCanvas)
    const qrCentre = () => qrDraw().args[2] + qrDraw().args[4] / 2
    // The hairline over the address: the last rectangle the card fills.
    const hairlineTop = () => ctx.calls.filter((call) => call.name === 'fillRect').at(-1).args[1]

    it('leaves the labelled line off and keeps the community line', async () => {
      await drawGradidoCard(QUIET)

      const texts = textsDrawn(ctx)
      expect(texts).not.toContain('Benutzername')
      expect(texts).toContain('Gemeinschaft')
      expect(texts).toContain('KI Playground')
      // Still printed where it belongs: as the name at the top, and in the address at the foot.
      expect(texts.filter((text) => text === 'bernd')).toHaveLength(2)
    })

    // ⛔ Two letters are enough to give the name back. The letters follow the line the disc
    // stands beside (AS-010); the colour keeps hashing the real initials, so nobody's disc
    // changes colour -- and an already printed card stays in step with the screen.
    it('letters the disc from what it was given and colours it from the seed', async () => {
      await drawGradidoCard(QUIET)

      const letters = ctx.calls.find((call) => call.name === 'fillText' && call.args[0] === 'BE')
      expect(letters.fillStyle).toBe(avatarPaletteEntry('BH').text)
      expect(ctx.calls.find((call) => call.name === 'fill').fillStyle).toBe(
        avatarPaletteEntry('BH').bg,
      )
    })

    /**
     * The freed row goes to the band rather than staying a hole under the community line.
     * The band therefore keeps its bottom edge and grows upwards, and everything centred in
     * it rises by HALF the row -- 21 px, which is 1.75 mm on paper.
     *
     * ⚠️ Moving the band up without growing it would also raise the picture, by the whole
     * row, and leave the gap at the foot instead. That is why this measures the distance and
     * not merely the direction.
     */
    it('gives the freed row to the band, and leaves the foot of the card alone', async () => {
      await drawGradidoCard(CARD)
      const withLine = { picture: pictureCentre(), qr: qrCentre(), hairline: hairlineTop() }

      ctx = recordingContext()
      await drawGradidoCard(QUIET)

      expect(hairlineTop()).toBe(withLine.hairline)
      expect(withLine.picture - pictureCentre()).toBe(21)
      expect(withLine.qr - qrCentre()).toBe(21)
      // Picture and code share one centre line, before and after.
      expect(qrCentre()).toBe(pictureCentre())
    })

    it('leaves the code the size the address asks for', async () => {
      await drawGradidoCard(CARD)
      const withLine = qrDraw().args[3]

      ctx = recordingContext()
      await drawGradidoCard(QUIET)

      expect(qrDraw().args[3]).toBe(withLine)
    })
  })
})

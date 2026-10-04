// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CHAT_IMAGE_FULL_MAX_PIXELS } from './chatImageEdit'
import { printSheet } from './printSheet'
import {
  THANK_YOU_GREETING_SHEET_HEIGHT,
  THANK_YOU_GREETING_SHEET_PANELS,
  THANK_YOU_GREETING_SHEET_WIDTH,
  drawThankYouGreetingSheet,
  printThankYouGreetingSheet,
  thankYouGreetingSheetFile,
  thankYouGreetingSheetFileName,
} from './thankYouGreetingSheet'

/**
 * ⛔ What is on the paper, and where, cannot be corrected once it is printed. So this spec looks
 * at the drawing itself: there is no canvas here, and the stand-in below notes every call with
 * the font, the colour and the TRANSFORM in force when it happened -- which is what says in
 * which of the four panels a thing stands, and whether it stands on its head.
 */

// The stand-ins for the two fonts' waiting note what they were asked for and answer as each
// test says.
const fonts = vi.hoisted(() => ({ sans: [], hand: [], answer: async () => {} }))
vi.mock('./printFont', () => ({
  printFontReady: (texts) => {
    fonts.sans.push(texts)
    return fonts.answer()
  },
}))
vi.mock('./handwriting', async (importOriginal) => ({
  ...(await importOriginal()),
  handwritingReady: (texts) => {
    fonts.hand.push(texts)
    return fonts.answer()
  },
}))
vi.mock('./printSheet', () => ({ printSheet: vi.fn() }))
// 41 modules of 8 pixels, as `renderQrCodeCanvas` makes the code of a link.
const QR = { width: 328, height: 328 }
vi.mock('./qrCode', () => ({ renderQrCodeCanvas: vi.fn(async () => QR) }))

const mm = (value) => Math.round((value * 300) / 25.4)
const SHEET_W = mm(210)
const SHEET_H = mm(297)
const PANEL_W = SHEET_W / 2
const PANEL_H = SHEET_H / 2
const MARGIN = mm(13)
const ROOM = PANEL_W - 2 * MARGIN

const GOLD = '#8a6124'
const sizeIn = (font) => Number(/(\d+)px/.exec(font)?.[1]) || 0

/**
 * A context that paints nothing and notes everything. Text measures half its font size per
 * letter (plus the letter spacing in force); `reach` gives a text an ink that leans out of its
 * box, as handwriting does.
 */
const recordingContext = ({ letterSpacing = true, reach = () => ({ left: 0, right: 0 }) } = {}) => {
  const calls = []
  const stack = []
  // x' = a x + c y + e, y' = b x + d y + f
  let matrix = [1, 0, 0, 1, 0, 0]
  const state = { fillStyle: '', font: '', textAlign: 'start', imageSmoothingEnabled: true }
  if (letterSpacing) state.letterSpacing = '0px'

  const widthOf = (text) =>
    Array.from(String(text)).length *
    (0.5 * sizeIn(state.font) + (parseFloat(state.letterSpacing) || 0))
  const onSheet = (x, y) => [
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5],
  ]
  /** The box of something drawn, on the sheet: whatever the panel's turn made of its corners. */
  const boxOf = (left, top, right, bottom) => {
    const [x1, y1] = onSheet(left, top)
    const [x2, y2] = onSheet(right, bottom)
    return {
      left: Math.round(Math.min(x1, x2)),
      top: Math.round(Math.min(y1, y2)),
      right: Math.round(Math.max(x1, x2)),
      bottom: Math.round(Math.max(y1, y2)),
    }
  }
  const note = (call) =>
    calls.push({ ...call, ...state, turned: matrix[0] < 0, local: call.local ?? null })

  const ctx = {
    calls,
    measureText: (text) => {
      const width = widthOf(text)
      const { left, right } = reach(String(text))
      calls.push({ name: 'measureText', text: String(text), font: state.font })
      return { width, actualBoundingBoxLeft: left, actualBoundingBoxRight: width + right }
    },
    fillText: (text, x, y) => {
      const size = sizeIn(state.font)
      const { left, right } = reach(String(text))
      note({
        name: 'fillText',
        text: String(text),
        local: { x, y },
        // The ink: from the top of the tallest letter to the lowest descender.
        box: boxOf(x - left, y - size, x + widthOf(text) + right, y + 0.3 * size),
      })
    },
    fillRect: (x, y, width, height) =>
      note({
        name: 'fillRect',
        local: { x, y, width, height },
        box: boxOf(x, y, x + width, y + height),
      }),
    drawImage: (image, ...args) => {
      const [x, y, width, height] = args.length === 8 ? args.slice(4) : args
      note({
        name: 'drawImage',
        image,
        cut: args.length === 8 ? args.slice(0, 4) : null,
        local: { x, y, width, height },
        box: boxOf(x, y, x + width, y + height),
      })
    },
    save: () => stack.push([...matrix]),
    restore: () => {
      matrix = stack.pop()
    },
    translate: (x, y) => {
      matrix = [...matrix.slice(0, 4), ...onSheet(x, y)]
    },
    rotate: (angle) => {
      const [a, b, c, d, e, f] = matrix
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      matrix = [a * cos + c * sin, b * cos + d * sin, c * cos - a * sin, d * cos - b * sin, e, f]
    },
  }
  for (const key of Object.keys(state)) {
    Object.defineProperty(ctx, key, {
      get: () => state[key],
      set: (value) => {
        state[key] = value
      },
      enumerable: true,
    })
  }
  return ctx
}

const SHEET = {
  link: 'https://gdd.example/redeem/0123456789abcdef01234567',
  picture: '/img/thank-you-greeting/morning-light.svg',
  // One line in the stand-in's measure, where a letter is half its size wide.
  line: 'Danke, Sarah!',
  forWhom: 'FÜR SARAH',
  words: 'Liebe Sarah, mit Eurem iPad hat alles angefangen.\nEure Oma',
  signature: 'Oma-Emma',
  waits: 'Dein Dank wartet: 20 Gradido',
  scan: 'Halte die Kamera Deines Handys auf den Code und nimm ihn an — bis zum 18.10.2026.',
  free: 'Kostenfrei. Keine Verpflichtung.',
  slogan: 'Helfen. Schenken. Danken.',
}
const PHOTO = 'data:image/jpeg;base64,photo'

let ctx
let canvas
let createElement

const install = (options) => {
  ctx = recordingContext(options)
  return ctx
}

beforeEach(() => {
  vi.clearAllMocks()
  fonts.sans.length = 0
  fonts.hand.length = 0
  fonts.answer = async () => {}
  install()
  canvas = null
  const original = document.createElement.bind(document)
  createElement = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag !== 'canvas') return original(tag)
    canvas = {
      width: 0,
      height: 0,
      getContext: () => ctx,
      toDataURL: vi.fn(() => 'data:image/png;base64,c2hlZXQ='),
    }
    return canvas
  })
  // jsdom's Image never fires onload. This one is as large as what its address names: the logo,
  // a motif (36 : 25), a photo (36 : 25 to a pixel's rounding) -- and one that does not load.
  vi.stubGlobal(
    'Image',
    class {
      set src(value) {
        this._src = value
        const [width, height] = value.includes('logo')
          ? [500, 147]
          : value.startsWith('data:')
            ? [1080, 751]
            : [360, 250]
        Object.assign(this, { width, height, naturalWidth: width, naturalHeight: height })
        queueMicrotask(() => (value.includes('broken') ? this.onerror?.() : this.onload?.()))
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
  delete document.fonts
})

const draws = (name) => ctx.calls.filter((call) => call.name === name)
const texts = () => draws('fillText')
const textOf = (text) => texts().find((call) => call.text === text)
const pictureDraw = () =>
  draws('drawImage').find((call) => call.image !== QR && !call.image.src.includes('logo'))
const qrDraw = () => draws('drawImage').find((call) => call.image === QR)
const logoDraw = () => draws('drawImage').find((call) => call.image.src?.includes('logo'))
// The first fillRect is the white of the paper, the four after the last panel are the marks.
const marks = () => draws('fillRect').slice(1)

/** The part of a panel things may stand in: 13 mm inside every edge of the paper and every fold. */
const roomOf = ({ column, row }) => ({
  left: column * PANEL_W + MARGIN,
  right: (column + 1) * PANEL_W - MARGIN,
  top: row * PANEL_H + MARGIN,
  bottom: (row + 1) * PANEL_H - MARGIN,
})
const within = (box, room) =>
  box.left >= room.left &&
  box.right <= room.right &&
  box.top >= room.top &&
  box.bottom <= room.bottom
/** Everything drawn but the white of the paper and the four marks. */
const content = () => [...texts(), ...draws('drawImage')]
const panelOf = (call) =>
  Object.entries(THANK_YOU_GREETING_SHEET_PANELS).find(([, panel]) =>
    within(call.box, roomOf(panel)),
  )?.[0] ?? null

describe('drawThankYouGreetingSheet', () => {
  describe('the sheet', () => {
    it('is one A4 page at 300 dpi, white, handed back as a PNG', async () => {
      const sheet = await drawThankYouGreetingSheet(SHEET)

      expect([canvas.width, canvas.height]).toEqual([2480, 3508])
      expect([THANK_YOU_GREETING_SHEET_WIDTH, THANK_YOU_GREETING_SHEET_HEIGHT]).toEqual([
        2480, 3508,
      ])
      const [paper] = draws('fillRect')
      expect(paper.fillStyle).toBe('#ffffff')
      expect(paper.local).toEqual({ x: 0, y: 0, width: 2480, height: 3508 })
      // Nothing is drawn before the paper is white.
      expect(ctx.calls.find((call) => call.name !== 'measureText')).toBe(paper)
      expect(canvas.toDataURL).toHaveBeenCalledWith('image/png')
      expect(sheet).toBe('data:image/png;base64,c2hlZXQ=')
    })

    // Beyond that bound Safari hands back an empty picture without a word (chatImageEdit.js).
    it('is smaller than the largest drawing surface an iPhone allows', () => {
      expect(THANK_YOU_GREETING_SHEET_WIDTH * THANK_YOU_GREETING_SHEET_HEIGHT).toBeLessThanOrEqual(
        CHAT_IMAGE_FULL_MAX_PIXELS,
      )
    })

    it('names every colour itself: no token of the theme, nothing inherited', async () => {
      await drawThankYouGreetingSheet(SHEET)

      for (const call of [...texts(), ...draws('fillRect')]) {
        expect(call.fillStyle, call.text ?? 'fillRect').toMatch(/^#[0-9a-f]{6}$/)
      }
    })

    // A home printer bleeds on a filled area: the paper, the picture, the code, the logo and
    // four hairlines are all that is not text.
    it('fills no area but the paper and the four fold marks', async () => {
      await drawThankYouGreetingSheet(SHEET)

      expect(draws('fillRect')).toHaveLength(5)
      expect(draws('drawImage')).toHaveLength(3)
    })
  })

  describe('the four panels', () => {
    beforeEach(() => drawThankYouGreetingSheet(SHEET))

    it('has the front at the bottom right, upright: the picture and the first line', () => {
      expect(THANK_YOU_GREETING_SHEET_PANELS.front).toEqual({ column: 1, row: 1 })
      expect(panelOf(pictureDraw())).toBe('front')
      expect(pictureDraw().turned).toBe(false)
      expect(panelOf(textOf(SHEET.line))).toBe('front')
      expect(textOf(SHEET.line).turned).toBe(false)
    })

    it('has the back at the bottom left, upright: the code, its sentences, logo and slogan', () => {
      expect(THANK_YOU_GREETING_SHEET_PANELS.back).toEqual({ column: 0, row: 1 })
      for (const call of [
        qrDraw(),
        logoDraw(),
        textOf(SHEET.waits),
        textOf(SHEET.free),
        textOf(SHEET.slogan),
      ]) {
        expect(panelOf(call), call.text ?? 'picture').toBe('back')
        expect(call.turned).toBe(false)
      }
    })

    it('has the words at the top left, standing on their heads', () => {
      expect(THANK_YOU_GREETING_SHEET_PANELS.words).toEqual({ column: 0, row: 0 })
      for (const text of ['FÜR SARAH', 'Eure Oma', 'Oma-Emma']) {
        expect(panelOf(textOf(text)), text).toBe('words')
        expect(textOf(text).turned, text).toBe(true)
      }
      // On its head: what is the panel's top left for the reader is its bottom right on the
      // sheet. "FÜR SARAH" begins 13 mm from the fold down the middle, and 18 mm above the
      // fold across.
      const label = textOf('FÜR SARAH')
      expect(label.box.right).toBe(PANEL_W - MARGIN)
      const aboveTheFold = PANEL_H - label.box.bottom
      expect(aboveTheFold).toBeGreaterThanOrEqual(mm(17))
      expect(aboveTheFold).toBeLessThanOrEqual(mm(18))
      // And so the name that signs, last for the reader, is the highest of the three on the sheet.
      expect(textOf('Oma-Emma').box.bottom).toBeLessThan(textOf('Eure Oma').box.top)
      expect(textOf('Eure Oma').box.bottom).toBeLessThan(label.box.top)
    })

    it('leaves the top right empty, for the sender’s own hand: not a single mark of ink', () => {
      expect(THANK_YOU_GREETING_SHEET_PANELS.hand).toEqual({ column: 1, row: 0 })
      const hand = { left: PANEL_W, right: SHEET_W, top: 0, bottom: PANEL_H }
      const touching = content().filter(
        ({ box }) =>
          box.right > hand.left &&
          box.left < hand.right &&
          box.bottom > hand.top &&
          box.top < hand.bottom,
      )
      expect(touching).toEqual([])
    })

    it('has every thing it draws in exactly one of the three printed panels', () => {
      expect(content().length).toBeGreaterThan(8)
      for (const call of content()) {
        expect(['front', 'back', 'words'], call.text ?? 'picture').toContain(panelOf(call))
      }
    })
  })

  /**
   * ⛔ 13 mm stay free at every edge of the paper and at every fold. A home printer leaves a few
   * millimetres unprinted and "fit to page" moves everything a little; with that margin no fold
   * runs through a letter. What `panelOf` answers is "inside the 13 mm of which panel", so a
   * thing in a margin belongs to none.
   */
  describe('the margin of 13 mm', () => {
    const LONGEST = {
      line: 'Alles Gute auf Deinem Weg — und Danke für die gemeinsame Zeit mit Dir, liebe Anna.',
      forWhom: 'FÜR HANNELORE WILHELMINE VON DER HEIDEN ZU',
      words: `${'Liebe Hannelore, seit zwölf Jahren stehst Du am Samstag vor dem Fest um sechs in der Küche. '.repeat(
        3,
      )}\n\n${'Vergelt’s Gott, und komm bitte auch im nächsten Juni wieder! '.repeat(3)}`,
      signature: 'Besuchsdienst-Kirche',
    }
    const ADDRESS = `https://example.org/${'ein-sehr-langer-pfad-'.repeat(8)}ende`

    it.each([
      ['a motif', SHEET],
      ['a photo', { ...SHEET, picture: PHOTO }],
      ['no line', { ...SHEET, line: null }],
      ['no words', { ...SHEET, words: '' }],
      ['no name', { ...SHEET, forWhom: '' }],
      ['no user name', { ...SHEET, signature: '' }],
      ['a motif this wallet does not know', { ...SHEET, picture: null }],
      [
        'a line and nothing else',
        { ...SHEET, picture: null, forWhom: '', words: '', signature: '' },
      ],
      ['the longest texts a greeting can have', { ...SHEET, ...LONGEST }],
      [
        'a Greek line and a Greek name',
        { ...SHEET, line: 'Έτσι απλά — επειδή υπάρχεις.', forWhom: 'ΓΙΑ: ΣΟΦΙΑ' },
      ],
      ['an address in the words', { ...SHEET, words: `Schau mal: ${ADDRESS} — bis bald!` }],
      [
        'a line of one long word',
        { ...SHEET, line: 'Donaudampfschifffahrtsgesellschaftskapitänsmützenabzeichen'.repeat(2) },
      ],
      ['a name of one long word', { ...SHEET, forWhom: `FÜR ${'W'.repeat(40)}` }],
      [
        'words far too long for the panel',
        { ...SHEET, words: 'Danke für alles und noch viel mehr. '.repeat(400) },
      ],
      [
        'four hundred empty lines in the words',
        { ...SHEET, words: `Danke${'\n'.repeat(400)}Emma${'\n\nDanke'.repeat(200)}` },
      ],
      [
        'sentences on the back twice as long',
        {
          ...SHEET,
          waits: 'Το ευχαριστώ σου σε περιμένει εδώ: 1000,25 Gradido',
          scan: `${SHEET.scan} ${SHEET.scan}`,
          slogan: 'Gemeinschaftsbasiert. Dezentral. Open Source. Für Dich und mich.',
        },
      ],
      [
        'sentences on the back far longer than any language has them',
        { ...SHEET, waits: `${SHEET.waits} `.repeat(4), scan: `${SHEET.scan} `.repeat(5) },
      ],
    ])('holds nothing but the fold marks, with %s', async (_, sheet) => {
      await drawThankYouGreetingSheet(sheet)

      expect(content().length).toBeGreaterThan(3)
      for (const call of content()) {
        expect(
          panelOf(call),
          `${call.text ?? 'picture'} ${JSON.stringify(call.box)}`,
        ).not.toBeNull()
      }
    })

    // The stand-in above is proved on a sheet that breaks the rule: a text set across a fold.
    it('would be seen: a thing across a fold is in no panel', () => {
      const across = {
        box: { left: PANEL_W - 10, right: PANEL_W + 10, top: PANEL_H + 200, bottom: PANEL_H + 240 },
      }
      const atTheEdge = {
        box: { left: MARGIN - 1, right: MARGIN + 100, top: PANEL_H + 200, bottom: PANEL_H + 240 },
      }
      expect(panelOf(across)).toBeNull()
      expect(panelOf(atTheEdge)).toBeNull()
    })

    it('has the room of 79 mm for what a panel holds', () => {
      expect(Math.round((ROOM * 25.4) / 300)).toBe(79)
    })
  })

  describe('the fold marks', () => {
    beforeEach(() => drawThankYouGreetingSheet(SHEET))

    it('are four fine strokes of 4 mm, 4 mm from the edge, where the two folds end', () => {
      const hair = Math.max(2, mm(0.2))
      expect(marks().map((mark) => mark.local)).toEqual([
        { x: mm(4), y: Math.round(SHEET_H / 2 - hair / 2), width: mm(4), height: hair },
        { x: SHEET_W - mm(8), y: Math.round(SHEET_H / 2 - hair / 2), width: mm(4), height: hair },
        { x: Math.round(SHEET_W / 2 - hair / 2), y: mm(4), width: hair, height: mm(4) },
        { x: Math.round(SHEET_W / 2 - hair / 2), y: SHEET_H - mm(8), width: hair, height: mm(4) },
      ])
      for (const mark of marks()) {
        expect(mark.fillStyle).toBe('#b9b9b9')
        expect(mark.turned).toBe(false)
      }
    })

    // No line across the card: a mark ends long before the room of a panel begins.
    it('stay in the margin, and none runs across the card', () => {
      for (const mark of marks()) {
        expect(Math.max(mark.local.width, mark.local.height)).toBe(mm(4))
        expect(panelOf(mark)).toBeNull()
        // From the edge it stands at to its far end.
        const reach = Math.min(
          mark.box.right,
          SHEET_W - mark.box.left,
          mark.box.bottom,
          SHEET_H - mark.box.top,
        )
        expect(reach).toBeLessThan(MARGIN)
      }
    })
  })

  describe('the front', () => {
    it('sets the picture at 79 x 54.9 mm, a motif whole', async () => {
      await drawThankYouGreetingSheet(SHEET)

      const picture = pictureDraw()
      expect(picture.image.src).toBe(SHEET.picture)
      expect([picture.local.width, picture.local.height]).toEqual([
        ROOM,
        Math.round((ROOM * 25) / 36),
      ])
      expect(picture.local.x).toBe(MARGIN)
      expect((picture.local.height * 25.4) / 300).toBeCloseTo(54.8, 1)
      // 360 x 250 into 932 x 647: the whole width, and a twentieth of a pixel off its height.
      expect(picture.cut[2]).toBeCloseTo(360, 5)
      expect(picture.cut[3]).toBeGreaterThan(249.8)
      expect(picture.cut[3]).toBeLessThanOrEqual(250)
    })

    // A photo is 36 : 25 to a pixel's rounding. The place takes that pixel away, in the middle,
    // rather than stretch the picture -- as `object-fit: cover` does on the screen.
    it('fills the place with a photo without stretching it', async () => {
      await drawThankYouGreetingSheet({ ...SHEET, picture: PHOTO })

      const [x, y, width, height] = pictureDraw().cut
      expect(width / height).toBeCloseTo(ROOM / Math.round((ROOM * 25) / 36), 6)
      expect(width).toBeCloseTo(1080, 5)
      expect(height).toBeLessThan(751)
      expect(x).toBeCloseTo(0, 5)
      expect(y).toBeCloseTo((751 - height) / 2, 6)
    })

    it('sets the line 8 mm under the picture, centred, in the handwriting and its gold', async () => {
      await drawThankYouGreetingSheet(SHEET)

      const line = textOf(SHEET.line)
      expect(line.font).toBe(`600 ${mm(9.2)}px Caveat, "Open Sans", Helvetica, Arial, sans-serif`)
      expect(line.fillStyle).toBe(GOLD)
      const width = Array.from(SHEET.line).length * 0.5 * mm(9.2)
      expect(line.local.x).toBe(Math.round(PANEL_W / 2 - width / 2))
      const top = pictureDraw().local.y + pictureDraw().local.height + mm(8)
      expect(line.local.y).toBe(top + Math.round(mm(9.2) * 0.78))
    })

    it('has picture and line together 4 mm above the middle of the panel', async () => {
      await drawThankYouGreetingSheet(SHEET)

      const step = Math.round(mm(9.2) * 1.12)
      const block = Math.round((ROOM * 25) / 36) + mm(8) + step
      expect(pictureDraw().local.y).toBe(Math.round((PANEL_H - block) / 2) - mm(4))
    })

    it('sets a greeting without a line as its picture alone', async () => {
      await drawThankYouGreetingSheet({ ...SHEET, line: null })

      expect(texts().filter((call) => panelOf(call) === 'front')).toEqual([])
      expect(pictureDraw().local.y).toBe(
        Math.round((PANEL_H - Math.round((ROOM * 25) / 36)) / 2) - mm(4),
      )
    })

    it('sets a greeting whose motif this wallet does not know as its line alone', async () => {
      await drawThankYouGreetingSheet({ ...SHEET, picture: null })

      expect(pictureDraw()).toBeUndefined()
      const step = Math.round(mm(9.2) * 1.12)
      expect(textOf(SHEET.line).local.y).toBe(
        Math.round((PANEL_H - step) / 2) - mm(4) + Math.round(mm(9.2) * 0.78),
      )
    })

    describe('a line too long for one line', () => {
      const sizeOfLine = () => sizeIn(texts().find((call) => panelOf(call) === 'front').font)
      const lineTexts = () =>
        texts()
          .filter((call) => panelOf(call) === 'front')
          .map((call) => call.text)

      it('breaks at its spaces and keeps its size while three lines are enough', async () => {
        // 34 letters of 54.5 pixels a line: 17 letters fit the 932.
        await drawThankYouGreetingSheet({
          ...SHEET,
          line: 'Danke für alles, liebe Anna — Dein Bert',
        })

        expect(lineTexts()).toEqual(['Danke für alles,', 'liebe Anna — Dein', 'Bert'])
        expect(sizeOfLine()).toBe(mm(9.2))
      })

      it('becomes smaller until three lines hold it', async () => {
        // Four lines of 17 letters at the full size, three of 24 a little smaller.
        const line = 'Danke für die gemeinsame Zeit mit Dir, liebe Anna — Dein Bert'
        await drawThankYouGreetingSheet({ ...SHEET, line })

        expect(lineTexts()).toHaveLength(3)
        expect(lineTexts().join(' ')).toBe(line)
        expect(sizeOfLine()).toBeLessThan(mm(9.2))
        expect(sizeOfLine()).toBeGreaterThanOrEqual(mm(6.4))
      })

      it('never becomes smaller than 6.4 mm, and is cut after the third line then', async () => {
        const line = 'Danke und nochmals Danke und immer wieder Danke '.repeat(4).trim()
        await drawThankYouGreetingSheet({ ...SHEET, line })

        expect(sizeOfLine()).toBe(mm(6.4))
        expect(lineTexts()).toHaveLength(3)
        expect(lineTexts()[2]).toMatch(/ …$/)
        expect(line.startsWith(lineTexts().join(' ').replace(/ …$/, ''))).toBe(true)
      })

      // ⛔ As the card on the screen breaks it (`overflow-wrap: anywhere`). Unbroken it stood in
      // the margin and across the fold (measured on the planning session's sketch).
      it('is broken within a word that is longer than a line', async () => {
        const word = 'Donaudampfschifffahrtsgesellschaft'
        await drawThankYouGreetingSheet({ ...SHEET, line: `Danke ${word}` })

        expect(lineTexts()[0]).toBe('Danke')
        expect(lineTexts().slice(1).join('')).toBe(word)
        for (const call of texts().filter((call) => panelOf(call) === 'front')) {
          expect(call.box.right - call.box.left).toBeLessThanOrEqual(ROOM)
        }
      })
    })
  })

  describe('handwriting or not', () => {
    const HAND = /^600 \d+px Caveat, "Open Sans"/
    const PLAIN = /^italic 400 \d+px "Open Sans"/

    it('sets a line in the handwriting where every letter of it is in the font', async () => {
      await drawThankYouGreetingSheet({ ...SHEET, line: 'Просто так — потому что вы есть.' })

      expect(textOf('Просто так —').font).toMatch(HAND)
    })

    // As the card on the screen: 20px against 27px, italic, and more air between its lines.
    it('sets a line with a letter the handwriting lacks whole in the page’s font, italic and smaller', async () => {
      await drawThankYouGreetingSheet({ ...SHEET, line: 'Έτσι απλά — επειδή υπάρχεις.' })

      const lines = texts().filter((call) => panelOf(call) === 'front')
      expect(lines.map((call) => call.text).join(' ')).toBe('Έτσι απλά — επειδή υπάρχεις.')
      for (const call of lines) {
        expect(call.font).toMatch(PLAIN)
        expect(call.font).not.toContain('Caveat')
        expect(sizeIn(call.font)).toBe(Math.round((mm(9.2) * 20) / 27))
        expect(call.fillStyle).toBe(GOLD)
      }
      // Never mixed: one Greek letter, and all of the line is in the page's font.
      install()
      await drawThankYouGreetingSheet({ ...SHEET, line: 'Danke, Σοφία!' })
      expect(textOf('Danke, Σοφία!').font).toMatch(PLAIN)
    })

    it('gives the plain line more air between its lines than the handwriting', async () => {
      await drawThankYouGreetingSheet({
        ...SHEET,
        line: 'Σε ευχαριστώ πολύ για τη βοήθειά σου στον κήπο',
      })

      const [first, second] = texts().filter((call) => panelOf(call) === 'front')
      const size = Math.round((mm(9.2) * 20) / 27)
      expect(second.local.y - first.local.y).toBe(Math.round(size * 1.25))
    })

    it('signs with the user name in the handwriting, and in the page’s font where it cannot', async () => {
      await drawThankYouGreetingSheet(SHEET)
      expect(textOf('Oma-Emma').font).toBe(
        `600 ${mm(7.6)}px Caveat, "Open Sans", Helvetica, Arial, sans-serif`,
      )
      expect(textOf('Oma-Emma').fillStyle).toBe(GOLD)

      install()
      await drawThankYouGreetingSheet({ ...SHEET, signature: 'Σοφία' })
      expect(textOf('Σοφία').font).toMatch(PLAIN)
      expect(sizeIn(textOf('Σοφία').font)).toBe(Math.round((mm(7.6) * 20) / 27))
    })

    // The line decides for the line and the name for the name: a Greek line beside a Latin name.
    it('decides for each of the two on its own', async () => {
      await drawThankYouGreetingSheet({ ...SHEET, line: 'Ευχαριστώ!' })

      expect(textOf('Ευχαριστώ!').font).toMatch(PLAIN)
      expect(textOf('Oma-Emma').font).toMatch(HAND)
    })
  })

  describe('inside', () => {
    const inside = () => texts().filter((call) => panelOf(call) === 'words')

    it('sets whom it is for 18 mm under the upper edge: small, bold, spaced, in gold', async () => {
      await drawThankYouGreetingSheet(SHEET)

      const label = textOf('FÜR SARAH')
      expect(label.font).toBe(`700 ${mm(2.9)}px "Open Sans", Helvetica, Arial, sans-serif`)
      expect(label.fillStyle).toBe(GOLD)
      expect(label.letterSpacing).toBe(`${Math.round(mm(2.9) * 0.08)}px`)
      expect(label.local).toEqual({ x: MARGIN, y: mm(18) + Math.round(mm(2.9) * 0.8) })
      // The spacing is the label's alone.
      for (const call of texts().filter((call) => call !== label)) {
        expect(call.letterSpacing, call.text).toBe('0px')
      }
    })

    // Not every browser knows `letterSpacing` on a canvas.
    it('sets the label unspaced where the browser cannot space it', async () => {
      install({ letterSpacing: false })
      await drawThankYouGreetingSheet(SHEET)

      expect(textOf('FÜR SARAH').letterSpacing).toBeUndefined()
      expect('letterSpacing' in ctx).toBe(false)
    })

    it('sets the words 4.5 mm under it, from the left, with their own line breaks', async () => {
      await drawThankYouGreetingSheet(SHEET)

      const first = textOf('Liebe Sarah, mit Eurem iPad hat alles')
      expect(first.font).toBe(`400 ${mm(3.9)}px "Open Sans", Helvetica, Arial, sans-serif`)
      expect(first.fillStyle).toBe('#383838')
      expect(first.local).toEqual({
        x: MARGIN,
        y: mm(18) + mm(2.9) + mm(4.5) + Math.round(mm(3.9) * 0.8),
      })
      expect(inside().map((call) => call.text)).toEqual([
        'FÜR SARAH',
        'Liebe Sarah, mit Eurem iPad hat alles',
        'angefangen.',
        'Eure Oma',
        'Oma-Emma',
      ])
      const step = Math.round(mm(3.9) * 1.55)
      expect(textOf('angefangen.').local.y - first.local.y).toBe(step)
      expect(textOf('Eure Oma').local.y - first.local.y).toBe(2 * step)
    })

    it('makes an empty line of the sender’s half a line', async () => {
      await drawThankYouGreetingSheet({ ...SHEET, words: 'Liebe Sarah\n\nEure Oma\n\n\nEmma\n\n' })

      const step = Math.round(mm(3.9) * 1.55)
      const half = Math.round(step / 2)
      const y = (text) => textOf(text).local.y
      expect(y('Eure Oma') - y('Liebe Sarah')).toBe(step + half)
      expect(y('Emma') - y('Eure Oma')).toBe(step + 2 * half)
      // None at the end: the name follows 5 mm under the last line that says something.
      expect(y('Oma-Emma')).toBe(
        y('Emma') - Math.round(mm(3.9) * 0.8) + step + mm(5) + Math.round(mm(7.6) * 0.78),
      )
    })

    it('sets the user name 5 mm under the words', async () => {
      await drawThankYouGreetingSheet(SHEET)

      const last = textOf('Eure Oma')
      const step = Math.round(mm(3.9) * 1.55)
      expect(textOf('Oma-Emma').local).toEqual({
        x: MARGIN,
        y: last.local.y - Math.round(mm(3.9) * 0.8) + step + mm(5) + Math.round(mm(7.6) * 0.78),
      })
    })

    it('sets a greeting without words as whom it is for and who signs', async () => {
      await drawThankYouGreetingSheet({ ...SHEET, words: '' })

      expect(inside().map((call) => call.text)).toEqual(['FÜR SARAH', 'Oma-Emma'])
    })

    it('sets no label without a name, and no name without a user name', async () => {
      await drawThankYouGreetingSheet({ ...SHEET, forWhom: '', signature: '' })

      expect(inside().map((call) => call.text)).toEqual([
        'Liebe Sarah, mit Eurem iPad hat alles',
        'angefangen.',
        'Eure Oma',
      ])
      expect(inside()[0].local.y).toBe(mm(18) + Math.round(mm(3.9) * 0.8))
    })

    it('breaks a name longer than a line, within its word where it has to', async () => {
      await drawThankYouGreetingSheet({ ...SHEET, forWhom: `FÜR ${'W'.repeat(60)}` })

      const label = inside().filter(
        (call) => call.fillStyle === GOLD && sizeIn(call.font) === mm(2.9),
      )
      expect(label.map((call) => call.text).join('')).toBe(`FÜR${'W'.repeat(60)}`)
      expect(label.length).toBeGreaterThan(1)
      // The words begin under the last of its lines.
      const words = textOf('Liebe Sarah, mit Eurem iPad hat alles')
      expect(words.local.y).toBeGreaterThan(label[label.length - 1].local.y + mm(4.5))
    })

    describe('words too long for the panel', () => {
      const wordsDrawn = () => inside().filter((call) => call.fillStyle === '#383838')
      const sizeOfWords = () => sizeIn(wordsDrawn()[0].font)

      it('are broken within a word that is longer than a line', async () => {
        const address = `https://example.org/${'x'.repeat(120)}`
        await drawThankYouGreetingSheet({ ...SHEET, words: `Schau: ${address} Danke!` })

        const lines = wordsDrawn().map((call) => call.text)
        expect(lines[0]).toBe('Schau:')
        // The last piece of the address shares its line with the word after it.
        expect(lines.join('')).toBe(`Schau:${address} Danke!`)
        expect(lines.length).toBeGreaterThan(4)
        for (const call of wordsDrawn())
          expect(call.box.right - call.box.left).toBeLessThanOrEqual(ROOM)
      })

      it('keep their size while they fit', async () => {
        await drawThankYouGreetingSheet({ ...SHEET, words: 'Danke für alles. '.repeat(20) })

        expect(sizeOfWords()).toBe(mm(3.9))
        expect(
          wordsDrawn()
            .map((call) => call.text)
            .join(' '),
        ).not.toContain('…')
      })

      it('become smaller, down to 3 mm, before anything is cut', async () => {
        // More lines than the panel holds at 3.9 mm, few enough a little smaller.
        const words = 'Danke für alles, was Du getan hast. '.repeat(22).trim()
        await drawThankYouGreetingSheet({ ...SHEET, words })

        expect(sizeOfWords()).toBeLessThan(mm(3.9))
        expect(sizeOfWords()).toBeGreaterThanOrEqual(mm(3))
        expect(
          wordsDrawn()
            .map((call) => call.text)
            .join(' '),
        ).toBe(words)
      })

      it('are cut at the end, with three dots, where even 3 mm are too large', async () => {
        const words = 'Danke für alles, was Du getan hast. '.repeat(200).trim()
        await drawThankYouGreetingSheet({ ...SHEET, words })

        expect(sizeOfWords()).toBe(mm(3))
        const lines = wordsDrawn().map((call) => call.text)
        expect(lines[lines.length - 1]).toMatch(/[^\s.,;:!?] …$/)
        expect(words.startsWith(lines.join(' ').replace(/ …$/, ''))).toBe(true)
        // The name still stands under them, and above the margin.
        expect(panelOf(textOf('Oma-Emma'))).toBe('words')
        expect(textOf('Oma-Emma').local.y).toBeGreaterThan(wordsDrawn()[lines.length - 1].local.y)
      })
    })
  })

  describe('the back', () => {
    beforeEach(() => drawThankYouGreetingSheet(SHEET))

    it('sets the code at 38 mm, in the middle of the panel', () => {
      const code = qrDraw()
      expect([code.local.width, code.local.height]).toEqual([mm(38), mm(38)])
      expect(code.local.x).toBe(Math.round(PANEL_W / 2 - mm(38) / 2))
      expect(code.cut).toBeNull()
    })

    // The code is drawn larger than it is made (328 pixels on 449). Smoothed, every edge of a
    // module would be a grey seam; and nothing else on the sheet is drawn unsmoothed.
    it('draws the code with hard edges, and everything else smoothed', () => {
      expect(qrDraw().imageSmoothingEnabled).toBe(false)
      expect(pictureDraw().imageSmoothingEnabled).toBe(true)
      expect(logoDraw().imageSmoothingEnabled).toBe(true)
    })

    it('says under it what waits, how it is accepted, and that it costs nothing', () => {
      const code = qrDraw()
      const waits = textOf(SHEET.waits)
      expect(waits.font).toBe(`700 ${mm(4.3)}px "Open Sans", Helvetica, Arial, sans-serif`)
      expect(waits.fillStyle).toBe('#383838')
      expect(waits.local.y).toBe(code.local.y + mm(38) + mm(6) + Math.round(mm(4.3) * 0.8))

      const scan = texts().filter(
        (call) => sizeIn(call.font) === mm(3.3) && call.text !== SHEET.free,
      )
      expect(scan.map((call) => call.text).join(' ')).toBe(SHEET.scan)
      expect(scan.length).toBeGreaterThan(1)
      for (const call of scan) {
        expect(call.font).toBe(`400 ${mm(3.3)}px "Open Sans", Helvetica, Arial, sans-serif`)
        expect(call.fillStyle).toBe('#4a4a4a')
      }
      expect(scan[0].local.y).toBe(
        waits.local.y -
          Math.round(mm(4.3) * 0.8) +
          Math.round(mm(4.3) * 1.3) +
          mm(2.5) +
          Math.round(mm(3.3) * 0.8),
      )
      expect(scan[1].local.y - scan[0].local.y).toBe(Math.round(mm(3.3) * 1.45))

      const free = textOf(SHEET.free)
      expect(free.fillStyle).toBe('#4a4a4a')
      expect(free.local.y).toBe(
        scan[scan.length - 1].local.y + Math.round(mm(3.3) * 1.45) + mm(2.2),
      )
    })

    it('centres every line of it', () => {
      for (const call of texts().filter((call) => panelOf(call) === 'back')) {
        const width = Array.from(call.text).length * 0.5 * sizeIn(call.font)
        expect(call.local.x, call.text).toBe(Math.round(PANEL_W / 2 - width / 2))
      }
    })

    it('carries the logo at 6.2 mm and under it the slogan of the cards, on the margin', () => {
      const logo = logoDraw()
      expect(logo.local.height).toBe(mm(6.2))
      expect(logo.local.width).toBeCloseTo((500 * mm(6.2)) / 147, 5)
      const slogan = textOf(SHEET.slogan)
      expect(slogan.font).toBe(`400 ${mm(2.6)}px "Open Sans", Helvetica, Arial, sans-serif`)
      expect(slogan.fillStyle).toBe('#4a6741')
      expect(slogan.local.y).toBe(logo.local.y + mm(6.2) + mm(1.8) + Math.round(mm(2.6) * 0.8))
      // The slogan's line, not its baseline, ends on the margin: descenders stay out of it.
      expect(logo.local.y + mm(6.2) + mm(1.8) + Math.round(mm(2.6) * 1.3)).toBe(PANEL_H - MARGIN)
    })

    it('has code and sentences above the middle of the room over the foot', () => {
      const code = qrDraw()
      const free = textOf(SHEET.free)
      const blockBottom = free.local.y - Math.round(mm(3.3) * 0.8) + Math.round(mm(3.3) * 1.45)
      const middle = (code.local.y + blockBottom) / 2
      const room = (MARGIN + logoDraw().local.y) / 2
      expect(Math.abs(room - middle - mm(5.5))).toBeLessThanOrEqual(0.5)
    })
  })

  it('breaks the sentences of the back where a language is longer', async () => {
    const waits = 'Ваша благодарность ждёт вас здесь: 1000,25 Gradido'
    await drawThankYouGreetingSheet({ ...SHEET, waits })

    const lines = texts().filter((call) => sizeIn(call.font) === mm(4.3))
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.map((call) => call.text).join(' ')).toBe(waits)
    expect(lines[1].local.y - lines[0].local.y).toBe(Math.round(mm(4.3) * 1.3))
  })

  /**
   * Handwriting leans out of its boxes, and so does an italic: the tail of a "j" reaches left of
   * where the line is set. Counted by what a line advances by alone, that ink would stand in the
   * margin.
   */
  describe('ink that reaches beyond what a line advances by', () => {
    it('begins a line from the left at its ink, not left of the room', async () => {
      install({ reach: (text) => ({ left: text.startsWith('jetzt') ? 7 : 0, right: 0 }) })
      await drawThankYouGreetingSheet({ ...SHEET, words: 'jetzt\nDanke' })

      expect(textOf('jetzt').local.x).toBe(MARGIN + 7)
      expect(textOf('jetzt').box.left).toBe(
        PANEL_W - MARGIN - 7 - Array.from('jetzt').length * 0.5 * mm(3.9),
      )
      expect(panelOf(textOf('jetzt'))).toBe('words')
      expect(textOf('Danke').local.x).toBe(MARGIN)
    })

    it('counts it on both sides of a line when it breaks one', async () => {
      // 18 letters of 23 pixels are 414 wide; with 300 pixels of ink beyond on either side the
      // line needs 1014 and is broken, where 414 alone would have fitted the 932.
      install({ reach: (text) => ({ left: 0, right: text.length > 12 ? 300 : 0 }) })
      await drawThankYouGreetingSheet({ ...SHEET, words: 'Danke für alles Du' })

      expect(textOf('Danke für alles Du')).toBeUndefined()
      expect(textOf('Danke für')).toBeDefined()
    })
  })

  /**
   * A canvas does not wait for a web font: it draws -- and MEASURES -- in the fallback, and paper
   * cannot be corrected. The sheet has two fonts, and each is waited for with the texts that are
   * set in it.
   */
  describe('the two fonts', () => {
    const GREEK = {
      ...SHEET,
      line: 'Έτσι απλά — επειδή υπάρχεις.',
      forWhom: 'ΓΙΑ: ΣΟΦΙΑ',
      words: 'Спасибо за помощь! Bahçedeki yardım için teşekkürler.',
      signature: 'Oma-Emma',
      waits: 'Το ευχαριστώ σου περιμένει: 20 Gradido',
      scan: 'Наведите камеру на код.',
      free: 'Δωρεάν. Χωρίς δέσμευση.',
      slogan: 'Yardım et. Hediye et. Teşekkür et.',
    }
    const asked = (list) => new Set(list.filter((text) => typeof text === 'string').join(' '))

    it('measures and writes nothing until both are there', async () => {
      const arrive = []
      fonts.answer = () => new Promise((resolve) => arrive.push(resolve))

      let drawn = false
      const drawing = drawThankYouGreetingSheet(SHEET).then((sheet) => {
        drawn = true
        return sheet
      })
      // Long enough for everything else the drawer waits for -- its pictures, the code.
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(fonts.sans).toHaveLength(1)
      expect(fonts.hand).toHaveLength(1)
      expect(ctx.calls).toEqual([])
      expect(drawn).toBe(false)

      // One of the two is not enough.
      arrive[0]()
      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(ctx.calls).toEqual([])

      arrive[1]()
      await expect(drawing).resolves.toBe('data:image/png;base64,c2hlZXQ=')
      expect(texts().length).toBeGreaterThan(0)
    })

    it('hands every character it sets in the page’s font to that font’s waiting', async () => {
      await drawThankYouGreetingSheet({
        ...GREEK,
        // Long enough to be cut, so the three dots are set too.
        words: `${GREEK.words} `.repeat(120),
      })

      const sans = ctx.calls.filter((call) => call.text && !/^600 \d+px Caveat/.test(call.font))
      expect(sans.some((call) => call.text.includes('…'))).toBe(true)
      const known = asked(fonts.sans[0])
      const missing = [...new Set(sans.flatMap((call) => [...call.text]))].filter(
        (char) => !known.has(char),
      )
      expect(missing).toEqual([])
      // The fixed sentences too, not only what the sender wrote.
      for (const text of [GREEK.waits, GREEK.scan, GREEK.free, GREEK.slogan, GREEK.forWhom]) {
        expect(fonts.sans[0]).toContain(text)
      }
    })

    it('hands every character it sets in the handwriting to the handwriting’s waiting', async () => {
      await drawThankYouGreetingSheet({
        ...SHEET,
        // Long enough to be cut after its third line.
        line: 'Спасибо за помощь и за всё остальное '.repeat(8).trim(),
      })

      const hand = ctx.calls.filter((call) => call.text && /^600 \d+px Caveat/.test(call.font))
      expect(hand.some((call) => call.name === 'fillText' && call.text.endsWith('…'))).toBe(true)
      const known = asked(fonts.hand[0])
      const missing = [...new Set(hand.flatMap((call) => [...call.text]))].filter(
        (char) => !known.has(char),
      )
      expect(missing).toEqual([])
      expect(fonts.hand[0]).toContain('Oma-Emma')
    })

    // What is not set in the handwriting does not fetch its file.
    it('asks the handwriting for nothing where no text is set in it', async () => {
      await drawThankYouGreetingSheet({ ...GREEK, signature: '' })

      expect(fonts.hand).toEqual([[]])
      expect(texts().some((call) => call.font.includes('Caveat'))).toBe(false)
    })

    it('does not ask the handwriting for a line it cannot write', async () => {
      await drawThankYouGreetingSheet(GREEK)

      expect(fonts.hand[0]).toContain('Oma-Emma')
      expect(fonts.hand[0]).not.toContain(GREEK.line)
      // Open Sans draws it, so Open Sans is asked for it.
      expect(fonts.sans[0]).toContain(GREEK.line)
    })

    it('is drawn all the same when neither font can be loaded', async () => {
      const { printFontReady } = await vi.importActual('./printFont')
      const { handwritingReady } = await vi.importActual('./handwriting')
      const load = vi.fn(() => Promise.reject(new Error('NetworkError')))
      Object.defineProperty(document, 'fonts', { configurable: true, value: { load } })
      fonts.answer = () =>
        Promise.all([printFontReady(fonts.sans[0]), handwritingReady(fonts.hand[0])])

      await expect(drawThankYouGreetingSheet(SHEET)).resolves.toBe('data:image/png;base64,c2hlZXQ=')
      expect(load).toHaveBeenCalledWith('600 16px Caveat', expect.stringContaining('Oma-Emma'))
      expect(load).toHaveBeenCalledWith(
        '400 16px "Open Sans"',
        expect.stringContaining('Kostenfrei'),
      )
      expect(texts().length).toBeGreaterThan(0)
    })
  })

  describe('a picture that does not load', () => {
    it('rejects: no sheet with an empty place for its picture', async () => {
      await expect(
        drawThankYouGreetingSheet({ ...SHEET, picture: '/img/thank-you-greeting/broken.svg' }),
      ).rejects.toThrow('cannot load image')
      // Not even a surface was made.
      expect(canvas).toBeNull()
    })

    // A photo is handed in as an address that holds the whole of it.
    it('does not carry the address of the picture in its message', async () => {
      const failure = await drawThankYouGreetingSheet({
        ...SHEET,
        picture: 'data:image/jpeg;base64,broken-photo',
      }).catch((error) => error)

      expect(failure).toBeInstanceOf(Error)
      expect(failure.message).not.toContain('broken-photo')
      expect(failure.message).not.toContain('data:')
    })
  })
})

/**
 * What the sheet becomes when it is folded: the upper half to the back, then the left half to
 * the back -- the printed side stays outside. Folded here from the table the drawer draws by,
 * so a panel that moves is seen where it matters: on the card.
 */
describe('the card the sheet folds into', () => {
  const at = (column, row) =>
    Object.entries(THANK_YOU_GREETING_SHEET_PANELS).find(
      ([, panel]) => panel.column === column && panel.row === row,
    )[0]
  /**
   * After the first fold the lower half faces the reader and the upper half faces away, turned
   * over its long edge: seen from behind, its left is the sheet's right, and what stood on its
   * head is upright. After the second fold the right of the lower half is the front, its left
   * the back, and the upper half lies inside, opened like a book.
   */
  const folded = () => ({
    front: at(1, 1),
    back: at(0, 1),
    insideLeft: at(1, 0),
    insideRight: at(0, 0),
  })

  it('has the picture in front, the words inside on the right, the free page on their left, the code on the back', () => {
    expect(folded()).toEqual({
      front: 'front',
      back: 'back',
      insideLeft: 'hand',
      insideRight: 'words',
    })
  })

  /**
   * ⚠️ The sentence on "Fertig" is a claim about this sheet. Whoever moves a panel has to change
   * the sentence, and whoever changes the sentence has to look at the panels: both stand here.
   */
  it('is what the sentence on "Fertig" says becomes of the sheet', () => {
    const german = JSON.parse(
      readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), '..', 'locales', 'de.json'),
        'utf8',
      ),
    )
    expect(german['thank-you-greeting'].paper.hint).toBe(
      'Ein A4-Blatt, einseitig bedruckt. Falte es zweimal, die bedruckte Seite nach außen: Dein Bild liegt dann vorn, Deine Worte stehen innen, und daneben ist Platz für Deine Handschrift.',
    )

    const card = folded()
    // "Dein Bild liegt dann vorn"
    expect(card.front).toBe('front')
    // "Deine Worte stehen innen, und daneben ist Platz für Deine Handschrift"
    expect([card.insideLeft, card.insideRight].sort()).toEqual(['hand', 'words'])
    // "einseitig bedruckt": the four panels are the four quarters of ONE side.
    expect(Object.keys(THANK_YOU_GREETING_SHEET_PANELS).sort()).toEqual([
      'back',
      'front',
      'hand',
      'words',
    ])
  })

  it('uses each of the four quarters once', () => {
    const places = Object.values(THANK_YOU_GREETING_SHEET_PANELS).map(
      ({ column, row }) => `${column}/${row}`,
    )
    expect(new Set(places)).toEqual(new Set(['0/0', '1/0', '0/1', '1/1']))
  })

  // Folded to the back, the upper half is turned over: only what was drawn on its head is
  // upright inside the card. The lower half is never turned.
  it('has the upper half drawn on its head and the lower half upright', async () => {
    await drawThankYouGreetingSheet(SHEET)

    for (const call of content()) {
      const upper = call.box.bottom <= PANEL_H
      expect(call.turned, call.text ?? 'picture').toBe(upper)
    }
  })
})

describe('printThankYouGreetingSheet', () => {
  const page = async () => {
    await printThankYouGreetingSheet('data:image/png;base64,c2hlZXQ=')
    return vi.mocked(printSheet).mock.calls[0][0]
  }

  // ⛔ The millimetres are what makes the folds meet the marks.
  it('lays the sheet out on an A4 page without a margin, at the size of the paper', async () => {
    const { style } = await page()

    expect(style).toContain('@page { size: A4; margin: 0 }')
    expect(style).toContain('.sheet img { width: 210mm; height: 297mm; display: block }')
    expect(style).not.toMatch(/padding:\s*[1-9]/)
  })

  it('puts exactly one picture on the page: the sheet as it was drawn', async () => {
    const { build } = await page()
    const doc = document.implementation.createHTMLDocument('')

    build(doc)

    expect(doc.querySelectorAll('img')).toHaveLength(1)
    expect(doc.querySelector('.sheet > img').src).toBe('data:image/png;base64,c2hlZXQ=')
    expect(doc.body.children).toHaveLength(1)
  })

  it('goes through the print frame the cards use, once', async () => {
    await page()

    expect(printSheet).toHaveBeenCalledTimes(1)
  })
})

describe('thankYouGreetingSheetFileName', () => {
  it('names the file by the greeting, without an amount in front', () => {
    expect(thankYouGreetingSheetFileName('Dank-Gruß für Sarah')).toBe('Dank-Gruß für Sarah.png')
    expect(thankYouGreetingSheetFileName('Dank-Gruß')).toBe('Dank-Gruß.png')
  })

  // The name is whatever the sender typed. The cheque's builder knows what a file name has to
  // survive; these prove it is used, not its rules once more.
  it.each([
    ['a path', 'Dank-Gruß für Sarah/../../etc', /^Dank-Gruß für Sarah [. ]+etc\.png$/],
    [
      'what Windows forbids',
      'Dank-Gruß für a<b>c:d"e|f?g*h\\i',
      /^Dank-Gruß für [^<>:"/\\|?*]+\.png$/,
    ],
    ['line breaks and tabs', 'Dank-Gruß für Sarah\n\tMüller', /^Dank-Gruß für Sarah Müller\.png$/],
    ['dots at the end', 'Dank-Gruß für Sarah...', /^Dank-Gruß für Sarah\.png$/],
    [
      'letters of other scripts',
      'Открытка с благодарностью — Σοφία 💛',
      /^Открытка с благодарностью — Σοφία 💛\.png$/,
    ],
  ])('survives %s in the name', (_, label, expected) => {
    expect(thankYouGreetingSheetFileName(label)).toMatch(expected)
  })

  it('never ends in two dots and never is a name Windows reserves', () => {
    expect(thankYouGreetingSheetFileName('CON')).not.toBe('CON.png')
    expect(thankYouGreetingSheetFileName('Dank-Gruß für .')).not.toContain('..png')
  })

  // "… für {name}" with a name of forty characters, the longest a greeting takes.
  it('holds the longest label whole, in every language of the wallet', () => {
    const here = join(dirname(fileURLToPath(import.meta.url)), '..', 'locales')
    const languages = readdirSync(here).filter((file) => file.endsWith('.json'))
    expect(languages).toHaveLength(10)
    for (const file of languages) {
      const greeting = JSON.parse(readFileSync(join(here, file), 'utf8'))['thank-you-greeting']
      const name = 'Hannelore Wilhelmine von der Heiden zu M'
      expect(name).toHaveLength(40)
      const label = greeting.list.for.replace('{name}', name)
      // The Greek label has a colon, which a file name on Windows cannot carry.
      const expected = label.replace(/:/g, ' ').replace(/\s+/g, ' ')
      expect(thankYouGreetingSheetFileName(label), file).toBe(`${expected}.png`)
    }
  })
})

describe('thankYouGreetingSheetFile', () => {
  it('is the drawn picture as a PNG file under the given name', async () => {
    const bytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 255, 128])
    const sheet = `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`

    const file = thankYouGreetingSheetFile(sheet, 'Dank-Gruß für Sarah.png')

    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe('Dank-Gruß für Sarah.png')
    expect(file.type).toBe('image/png')
    // jsdom's File has no arrayBuffer().
    const read = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(new Uint8Array(reader.result))
      reader.readAsArrayBuffer(file)
    })
    expect(read).toEqual(bytes)
  })
})

// AI-GENERATED — not an architecture reference

// The face of the handwriting: declared once, and taken in by whatever sets a line in it.
import '@/assets/fonts/caveat/caveat.css'
import {
  HANDWRITING_FAMILY,
  HANDWRITING_WEIGHT,
  canWriteByHand,
  handwritingReady,
} from './handwriting'
import { printFontReady } from './printFont'
import { printSheet } from './printSheet'
import { renderQrCodeCanvas } from './qrCode'
import { chequeFileName } from './thankYouCheque'

/**
 * The sheet a thank-you greeting is printed on (ZE-017, F8): one A4 page, printed on one side
 * and folded twice, is a card of 105 x 148.5 mm -- the picture and the first line in front, the
 * words inside with a free page beside them for the sender's own hand, and on the back who
 * thanks and the code.
 *
 *   the sheet as it lies in the printer, printed side up:
 *
 *        +-----------------+-----------------+
 *        |  INSIDE RIGHT   |  INSIDE LEFT    |     both stand on their heads: after
 *        |  whom it is for,|  empty, for the |     the first fold they are upright
 *        |  the words      |  hand           |     inside the card
 *   1 -- +-----------------+-----------------+ -- 1   first fold: the upper half to the back
 *        |  BACK           |  FRONT          |
 *        |  who thanks,    |  picture, line  |
 *        |  the code       |                 |
 *        +-----------------+-----------------+
 *                          2                          second fold: the left half to the back
 *
 * ONE drawing surface for the whole page, so that what is printed and what is saved as a
 * picture are the same drawing.
 *
 * ⛔ Nothing is signed inside (Bernd, with the first printed card in hand, 04.10.2026): that is
 * where the sender signs by hand. Who thanks stands on the back, over the code.
 *
 * ## 13 mm stay free in every panel, at every edge of the paper and at every fold
 *
 * A home printer leaves a few millimetres unprinted, and "fit to page" moves everything a
 * little. Nothing but the four fold marks stands in that margin, so no fold runs through a
 * letter and no printer cuts one off. It leaves 79 mm of width for what a panel holds.
 *
 * So every text is broken to that room -- a word longer than a line WITHIN the word, as the
 * card on the screen breaks it (`overflow-wrap: anywhere`): an address in the sender's words
 * would otherwise stand in the margin and across the fold. What does not fit its panel is made
 * smaller first, and only then cut at the end, with three dots.
 *
 * ## White, with no area but the picture
 *
 * This is printed at home. Paper is white in both themes, so every colour is written out here
 * and none follows the wallet's theme; and a filled area bleeds on an inkjet.
 *
 * ## No print density in the file
 *
 * As with the cards (see the note in `printSheet.js`): the physical size is carried by the
 * page the picture is printed on, in millimetres.
 */

const DPI = 300
const mm = (value) => Math.round((value * DPI) / 25.4)

/** A4 upright at 300 dpi: 2480 x 3508 -- below what an iPhone's browser allows a drawing surface. */
export const THANK_YOU_GREETING_SHEET_WIDTH = mm(210)
export const THANK_YOU_GREETING_SHEET_HEIGHT = mm(297)

const PANEL_WIDTH = THANK_YOU_GREETING_SHEET_WIDTH / 2
const PANEL_HEIGHT = THANK_YOU_GREETING_SHEET_HEIGHT / 2
const MARGIN = mm(13)
const ROOM = PANEL_WIDTH - 2 * MARGIN

/**
 * Where the four panels lie on the sheet, by column and row from its top left. The upper row
 * is drawn turned by half a circle.
 *
 * ⚠️ The sentence on "Fertig" (`thank-you-greeting.paper.hint`) says what becomes of the sheet
 * -- the picture in front, the words inside, a free page beside them. It is true of THIS order
 * and of no other; thankYouGreetingSheet.spec.js folds the sheet and holds the two together.
 */
export const THANK_YOU_GREETING_SHEET_PANELS = Object.freeze({
  words: Object.freeze({ column: 0, row: 0 }),
  hand: Object.freeze({ column: 1, row: 0 }),
  back: Object.freeze({ column: 0, row: 1 }),
  front: Object.freeze({ column: 1, row: 1 }),
})

// Open Sans ships with the wallet and is waited for before the first word is measured (see
// printFont.js); the families behind it only draw if the font cannot be loaded at all.
const SANS = '"Open Sans", Helvetica, Arial, sans-serif'
const sansFont = (weight, size) => `${weight} ${size}px ${SANS}`
// What the handwriting lacks -- a sign that is no letter -- is drawn in Open Sans.
const handFont = (size) => `${HANDWRITING_WEIGHT} ${size}px ${HANDWRITING_FAMILY}, ${SANS}`
const plainFont = (size) => `italic 400 ${size}px ${SANS}`

const COLOR_TEXT = '#383838'
const COLOR_SOFT = '#4a4a4a'
// The card's own brown gold on the screen: "FÜR ...", the first line.
const COLOR_GOLD = '#8a6124'
// The slogan, as on the two printed cards.
const COLOR_GREEN = '#4a6741'
const COLOR_MARK = '#b9b9b9'

const LOGO_PATH = '/img/brand/gradido-logo.png'
const ELLIPSIS = '…'

// Canvas has no line box, so a baseline is placed by hand: this share of the font size under
// the top of the line.
const SANS_ASCENT = 0.8
const HAND_ASCENT = 0.78

// ---- the front: the picture, and the first line under it --------------------------------------
const PICTURE_WIDTH = ROOM
// 36 : 25, the place of a greeting's picture everywhere (thankYouMotifs.js, thankYouPicture.js).
const PICTURE_HEIGHT = Math.round((PICTURE_WIDTH * 25) / 36)
const LINE_SIZE = mm(9.2)
const LINE_MIN_SIZE = mm(6.4)
const LINE_MAX_LINES = 3
const LINE_GAP = mm(8)
// A card stands on its lower edge, and the eye puts the middle of an upright page higher than
// it is: picture and line stand this much above the middle of the panel.
const FRONT_LIFT = mm(4)

// A text meant for the handwriting that holds a letter the handwriting lacks is set whole in
// the page's font, italic and smaller -- as the card on the screen sets such a line, at 20px
// against 27px and with more air between its lines (RedeemThanksPaper).
const HAND_LEADING = 1.12
const PLAIN_SHARE = 20 / 27
const PLAIN_LEADING = 1.25

// ---- inside, the right page: whom it is for, the words ----------------------------------------
const INSIDE_TOP = mm(18)
const FOR_SIZE = mm(2.9)
const FOR_SPACING = Math.round(FOR_SIZE * 0.08)
const FOR_LEADING = 1.4
const WORDS_GAP = mm(4.5)
const WORDS_SIZE = mm(3.9)
const WORDS_MIN_SIZE = mm(3)
const WORDS_LEADING = 1.55

// ---- the back: who thanks, the code, what it is, and whose card this is -----------------------
// Who thanks, over the code and in the handwriting, as the first line on the front is: the
// card speaks in one voice on both of its outer sides.
const FROM_SIZE = mm(7.6)
const FROM_MIN_SIZE = mm(5.6)
const FROM_MAX_LINES = 2
const FROM_GAP = mm(5)
const QR_SIZE = mm(38)
const QR_GAP = mm(6)
const WAITS_SIZE = mm(4.3)
const WAITS_LEADING = 1.3
const SCAN_GAP = mm(2.5)
const HINT_SIZE = mm(3.3)
const HINT_LEADING = 1.45
const FREE_GAP = mm(2.2)
const LOGO_HEIGHT = mm(6.2)
const SLOGAN_GAP = mm(1.8)
const SLOGAN_SIZE = mm(2.6)
// The slogan's line reaches down to the margin with its box, not with its baseline: the
// descenders of "Help. Give. Thank." stay out of the margin as well.
const SLOGAN_LEADING = 1.3
// Code and sentences stand in the middle of the room above the foot, lifted as the front is.
const BACK_LIFT = mm(5.5)

// ---- the fold marks: four short strokes at the edges, none across the card --------------------
const MARK_FROM_EDGE = mm(4)
const MARK_LENGTH = mm(4)
const MARK_WIDTH = Math.max(2, mm(0.2))

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    // ⛔ Not the source in the message: the picture of a greeting may be a photo, handed in
    // as an address that holds the whole of it.
    image.onerror = () => reject(new Error('cannot load image'))
    image.src = source
  })

/**
 * What a line takes of its room: what it advances by, and on either side what its ink reaches
 * beyond that. Handwriting leans out of its boxes, and so does an italic; counted by their
 * advance alone, the tail of a "j" at the beginning of a line would stand in the margin.
 *
 * ⚠️ Every text is measured and set from the left (`textAlign` stays 'left'): the ink's reach
 * is given from the point a text is set at.
 */
const measure = (ctx, text) => {
  const metrics = ctx.measureText(text)
  const left = Math.max(0, Math.ceil(metrics.actualBoundingBoxLeft ?? 0))
  const right = Math.max(
    0,
    Math.ceil((metrics.actualBoundingBoxRight ?? metrics.width) - metrics.width),
  )
  return { width: metrics.width, left, need: metrics.width + 2 * Math.max(left, right) }
}

const fits = (ctx, text, room) => measure(ctx, text).need <= room

/** One line from the left edge of its room; its ink begins at that edge, not before it. */
const setFromLeft = (ctx, text, x, baseline) =>
  ctx.fillText(text, x + measure(ctx, text).left, baseline)

/** One line with its middle at `centre`. */
const setCentred = (ctx, text, centre, baseline) =>
  ctx.fillText(text, Math.round(centre - ctx.measureText(text).width / 2), baseline)

/** What a reader takes for one letter: a letter with its marks, a sign of several code points. */
const letters = (text) =>
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? Array.from(
        new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text),
        ({ segment }) => segment,
      )
    : Array.from(text)

/** A word wider than the room, in pieces that fit: broken wherever a line is full. */
const breakWord = (ctx, word, room) => {
  const pieces = []
  let piece = ''
  for (const letter of letters(word)) {
    // A letter that alone is wider than the room still gets a line: there is nothing to cut.
    if (piece && !fits(ctx, piece + letter, room)) {
      pieces.push(piece)
      piece = letter
    } else {
      piece += letter
    }
  }
  if (piece) pieces.push(piece)
  return pieces
}

// Where a line may end: at every white space but the ones that say "not here" -- the no-break
// space, its narrow form and the figure space. The amount and its unit are joined by one.
const BREAKING_SPACE = /[^\S\u00a0\u202f\u2007]+/u
const NO_BREAK_SPACE = /[\u00a0\u202f\u2007]+/u

/**
 * The lines of one paragraph, broken at its spaces. A word longer than a line begins on a line
 * of its own and is broken within -- what the card on the screen does with it.
 *
 * What a no-break space joins stays on one line. Where it is longer than a line -- words pasted
 * from elsewhere can be joined like that from end to end -- it breaks at those spaces after
 * all, before any word is broken within.
 *
 * ⚠️ Not `wrapText` of the cheque: that one turns line breaks into spaces, cuts after a fixed
 * number of lines and never breaks a word.
 */
const wrapParagraph = (ctx, text, room) => {
  const lines = []
  let line = ''
  const place = (word) => {
    if (line && fits(ctx, `${line} ${word}`, room)) {
      line = `${line} ${word}`
      return
    }
    if (fits(ctx, word, room)) {
      if (line) lines.push(line)
      line = word
      return
    }
    const joined = word.split(NO_BREAK_SPACE).filter(Boolean)
    if (joined.length > 1) {
      joined.forEach(place)
      return
    }
    if (line) lines.push(line)
    const pieces = breakWord(ctx, word, room)
    line = pieces.pop()
    lines.push(...pieces)
  }
  String(text ?? '')
    .split(BREAKING_SPACE)
    .filter(Boolean)
    .forEach(place)
  if (line) lines.push(line)
  return lines
}

/**
 * The words as they were written: their own line breaks kept, each line broken to the room. An
 * empty line stands as `null`; none at the beginning and none at the end.
 */
const wrapWords = (ctx, text, room) => {
  const lines = String(text ?? '')
    .replace(/\r/g, '')
    .split('\n')
    .flatMap((paragraph) =>
      paragraph.trim() === '' ? [null] : wrapParagraph(ctx, paragraph, room),
    )
  while (lines.length && lines[0] === null) lines.shift()
  while (lines.length && lines[lines.length - 1] === null) lines.pop()
  return lines
}

/** A line that stands for more than it shows: its end gives way to three dots. */
const endWithEllipsis = (ctx, line, room) => {
  const kept = letters(line)
  const shown = () => {
    const text = kept.join('').replace(/[\s.,;:!?–—-]+$/u, '')
    return text ? `${text} ${ELLIPSIS}` : ELLIPSIS
  }
  while (kept.length && !fits(ctx, shown(), room)) kept.pop()
  return shown()
}

/**
 * How a text meant for the handwriting is set: in it where every letter of the text is in the
 * font (`canWriteByHand`), otherwise all of it in the page's font. The TEXT decides, whole --
 * never the language of the page, and never mixed.
 */
const handFace = (text, size, floor = size) =>
  canWriteByHand(text)
    ? { size, floor, font: handFont, leading: HAND_LEADING, ascent: HAND_ASCENT }
    : {
        size: Math.round(size * PLAIN_SHARE),
        floor: Math.round(floor * PLAIN_SHARE),
        font: plainFont,
        leading: PLAIN_LEADING,
        ascent: SANS_ASCENT,
      }

/**
 * A line in the handwriting in its room: at its full size where that takes no more lines than
 * it may, smaller down to its floor otherwise, and beyond that cut after its last line.
 */
const fitHand = (ctx, text, full, floor, maxLines) => {
  const face = handFace(text, full, floor)
  let size = face.size
  let lines
  for (;;) {
    ctx.font = face.font(size)
    lines = wrapParagraph(ctx, text, ROOM)
    if (lines.length <= maxLines || size <= face.floor) break
    size -= 1
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
    lines[maxLines - 1] = endWithEllipsis(ctx, lines[maxLines - 1], ROOM)
  }
  return { lines, font: face.font(size), size, step: Math.round(size * face.leading), face }
}

/** The first line: three lines at most, at 9.2 mm down to 6.4 mm. */
const fitLine = (ctx, line) => fitHand(ctx, line, LINE_SIZE, LINE_MIN_SIZE, LINE_MAX_LINES)

/** Who thanks, on the back: two lines at most, at 7.6 mm down to 5.6 mm. */
const fitFrom = (ctx, from) => fitHand(ctx, from, FROM_SIZE, FROM_MIN_SIZE, FROM_MAX_LINES)

/** Lines in the handwriting, centred on a panel, from `top` down. */
const setHand = (ctx, fitted, top) => {
  ctx.font = fitted.font
  ctx.fillStyle = COLOR_GOLD
  fitted.lines.forEach((text, index) =>
    setCentred(
      ctx,
      text,
      PANEL_WIDTH / 2,
      top + Math.round(fitted.size * fitted.face.ascent) + index * fitted.step,
    ),
  )
}

/** The picture in its place, filling it: what is over at two sides is left out, nothing is stretched. */
const drawPicture = (ctx, picture, x, y) => {
  const width = picture.naturalWidth || picture.width
  const height = picture.naturalHeight || picture.height
  if (!width || !height) {
    ctx.drawImage(picture, x, y, PICTURE_WIDTH, PICTURE_HEIGHT)
    return
  }
  const scale = Math.max(PICTURE_WIDTH / width, PICTURE_HEIGHT / height)
  const cutWidth = PICTURE_WIDTH / scale
  const cutHeight = PICTURE_HEIGHT / scale
  ctx.drawImage(
    picture,
    (width - cutWidth) / 2,
    (height - cutHeight) / 2,
    cutWidth,
    cutHeight,
    x,
    y,
    PICTURE_WIDTH,
    PICTURE_HEIGHT,
  )
}

const drawFront = (ctx, { picture, line }) => {
  const fitted = line ? fitLine(ctx, line) : null
  const lineBlock = fitted ? fitted.lines.length * fitted.step : 0
  const gap = picture && fitted ? LINE_GAP : 0
  const block = (picture ? PICTURE_HEIGHT : 0) + gap + lineBlock
  let top = Math.round((PANEL_HEIGHT - block) / 2) - FRONT_LIFT

  if (picture) {
    drawPicture(ctx, picture, MARGIN, top)
    top += PICTURE_HEIGHT + gap
  }
  if (fitted) setHand(ctx, fitted, top)
}

/**
 * The words in the height they have: at their full size where they fit, smaller down to their
 * floor otherwise, and beyond that cut at the end. With the longest texts a greeting can have
 * nothing is cut (measured); the cut is there so that nothing ever leaves the panel.
 */
const fitWords = (ctx, words, height) => {
  const heightOf = (lines, step) =>
    lines.reduce((sum, line) => sum + (line === null ? Math.round(step / 2) : step), 0)
  let size = WORDS_SIZE
  let lines
  let step
  for (;;) {
    ctx.font = sansFont(400, size)
    lines = wrapWords(ctx, words, ROOM)
    step = Math.round(size * WORDS_LEADING)
    if (heightOf(lines, step) <= height || size <= WORDS_MIN_SIZE) break
    size -= 1
  }
  if (heightOf(lines, step) > height) {
    while (lines.length > 1 && heightOf(lines, step) > height) lines.pop()
    while (lines.length > 1 && lines[lines.length - 1] === null) lines.pop()
    lines[lines.length - 1] = endWithEllipsis(ctx, lines[lines.length - 1], ROOM)
  }
  return { lines, size, step }
}

const drawInside = (ctx, { forWhom, words }) => {
  let top = INSIDE_TOP

  if (forWhom) {
    ctx.font = sansFont(700, FOR_SIZE)
    ctx.fillStyle = COLOR_GOLD
    // Not every browser knows `letterSpacing` on a canvas: where it is missing, the label
    // stands unspaced. Set BEFORE it is broken into lines -- the spacing is part of its width.
    const spaced = 'letterSpacing' in ctx
    if (spaced) ctx.letterSpacing = `${FOR_SPACING}px`
    const lines = wrapParagraph(ctx, forWhom, ROOM)
    const step = Math.round(FOR_SIZE * FOR_LEADING)
    lines.forEach((text, index) =>
      setFromLeft(ctx, text, MARGIN, top + Math.round(FOR_SIZE * SANS_ASCENT) + index * step),
    )
    if (spaced) ctx.letterSpacing = '0px'
    top += (lines.length - 1) * step + FOR_SIZE + WORDS_GAP
  }

  // The words have the page down to its margin: nothing is signed under them (see above).
  const fitted = fitWords(ctx, words, PANEL_HEIGHT - MARGIN - top)
  ctx.font = sansFont(400, fitted.size)
  ctx.fillStyle = COLOR_TEXT
  for (const text of fitted.lines) {
    // An empty line of the sender's is half a line here.
    if (text === null) {
      top += Math.round(fitted.step / 2)
      continue
    }
    setFromLeft(ctx, text, MARGIN, top + Math.round(fitted.size * SANS_ASCENT))
    top += fitted.step
  }
}

const drawBack = (ctx, { qr, logo, from, waits, scan, free, slogan }) => {
  const centre = PANEL_WIDTH / 2
  // The sentences are longer in some languages than in others: each is broken to the room.
  const sentence = (text, weight, size, leading) => {
    ctx.font = sansFont(weight, size)
    return { lines: wrapParagraph(ctx, text, ROOM), step: Math.round(size * leading) }
  }
  const sloganLines = sentence(slogan, 400, SLOGAN_SIZE, SLOGAN_LEADING)
  const waitsLines = sentence(waits, 700, WAITS_SIZE, WAITS_LEADING)
  const scanLines = sentence(scan, 400, HINT_SIZE, HINT_LEADING)
  const freeLines = sentence(free, 400, HINT_SIZE, HINT_LEADING)
  const heightOf = ({ lines, step }) => lines.length * step
  // Who thanks: without a user name nobody is named, and the code stands alone.
  const fromLines = from ? fitFrom(ctx, from) : null

  // The foot stands on the margin: the logo, and under it the slogan of the cards.
  const foot = LOGO_HEIGHT + (sloganLines.lines.length ? SLOGAN_GAP + heightOf(sloganLines) : 0)
  const footTop = PANEL_HEIGHT - MARGIN - foot
  const block =
    (fromLines ? heightOf(fromLines) + FROM_GAP : 0) +
    QR_SIZE +
    QR_GAP +
    heightOf(waitsLines) +
    SCAN_GAP +
    heightOf(scanLines) +
    (freeLines.lines.length ? FREE_GAP + heightOf(freeLines) : 0)
  // Never lifted into the margin, however long a language's sentences are. A line in the
  // handwriting reaches above its line with its tallest letters: where it is the first thing of
  // the block, that much more stays free.
  const reach = fromLines ? Math.round(fromLines.size * (1 - fromLines.face.ascent)) : 0
  let top = Math.max(
    MARGIN + reach,
    MARGIN + Math.round((footTop - MARGIN - block) / 2) - BACK_LIFT,
  )

  if (fromLines) {
    setHand(ctx, fromLines, top)
    top += heightOf(fromLines) + FROM_GAP
  }

  // ⚠️ The code is drawn larger than `renderQrCodeCanvas` hands it over (8 pixels a module).
  // Without smoothing its modules keep hard edges; smoothed, every edge would be a grey seam.
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(qr, Math.round(centre - QR_SIZE / 2), top, QR_SIZE, QR_SIZE)
  ctx.imageSmoothingEnabled = true
  top += QR_SIZE + QR_GAP

  const set = ({ lines, step }, weight, size, color) => {
    ctx.font = sansFont(weight, size)
    ctx.fillStyle = color
    for (const text of lines) {
      setCentred(ctx, text, centre, top + Math.round(size * SANS_ASCENT))
      top += step
    }
  }
  set(waitsLines, 700, WAITS_SIZE, COLOR_TEXT)
  top += SCAN_GAP
  set(scanLines, 400, HINT_SIZE, COLOR_SOFT)
  if (freeLines.lines.length) {
    top += FREE_GAP
    set(freeLines, 400, HINT_SIZE, COLOR_SOFT)
  }

  const logoWidth = logo.width * (LOGO_HEIGHT / logo.height)
  ctx.drawImage(logo, Math.round(centre - logoWidth / 2), footTop, logoWidth, LOGO_HEIGHT)
  top = footTop + LOGO_HEIGHT + SLOGAN_GAP
  set(sloganLines, 400, SLOGAN_SIZE, COLOR_GREEN)
}

/** Where the folds end, at the four edges: the first fold across, the second one down. */
const drawFoldMarks = (ctx) => {
  const across = Math.round(THANK_YOU_GREETING_SHEET_HEIGHT / 2 - MARK_WIDTH / 2)
  const down = Math.round(THANK_YOU_GREETING_SHEET_WIDTH / 2 - MARK_WIDTH / 2)
  ctx.fillStyle = COLOR_MARK
  ctx.fillRect(MARK_FROM_EDGE, across, MARK_LENGTH, MARK_WIDTH)
  ctx.fillRect(
    THANK_YOU_GREETING_SHEET_WIDTH - MARK_FROM_EDGE - MARK_LENGTH,
    across,
    MARK_LENGTH,
    MARK_WIDTH,
  )
  ctx.fillRect(down, MARK_FROM_EDGE, MARK_WIDTH, MARK_LENGTH)
  ctx.fillRect(
    down,
    THANK_YOU_GREETING_SHEET_HEIGHT - MARK_FROM_EDGE - MARK_LENGTH,
    MARK_WIDTH,
    MARK_LENGTH,
  )
}

/** Paints one panel in coordinates of its own, from its top left as the reader of the card sees it. */
const inPanel = (ctx, { column, row }, paint) => {
  ctx.save()
  if (row === 0) {
    // The upper half stands on its head: a panel's own top left is its bottom right on the sheet.
    ctx.translate((column + 1) * PANEL_WIDTH, PANEL_HEIGHT)
    ctx.rotate(Math.PI)
  } else {
    ctx.translate(column * PANEL_WIDTH, PANEL_HEIGHT)
  }
  paint()
  ctx.restore()
}

/**
 * Draw the sheet and return it as a PNG data URL.
 *
 * @param {object} sheet
 * @param {string} sheet.link what the code points at: the link of the greeting
 * @param {string | null} [sheet.picture] the greeting's picture as an address an image can be
 *   loaded from -- the file of a motif, or a photo as a `data:` or `blob:` address; none for a
 *   greeting whose motif this wallet does not know
 * @param {string | null} [sheet.line] the first line
 * @param {string} [sheet.forWhom] "FÜR SARAH", in capitals as it is set; empty without a name
 * @param {string} [sheet.words] the sender's words, with their own line breaks
 * @param {string} [sheet.from] who thanks, for the back: "Oma-Emma sagt Dir Danke"; empty where
 *   the sender has no user name
 * @param {string} sheet.waits "Dein Dank wartet: 20 Gradido"
 * @param {string} sheet.scan how the code is read and the thank-you accepted, and until when
 * @param {string} sheet.free "Kostenfrei. Keine Verpflichtung."
 * @param {string} sheet.slogan the slogan of the cards, under the logo
 * @returns {Promise<string>} a PNG data URL
 * @throws when a picture cannot be loaded; the caller decides what to say about it
 */
export const drawThankYouGreetingSheet = async ({
  link,
  picture = null,
  line = '',
  forWhom = '',
  words = '',
  from = '',
  waits,
  scan,
  free,
  slogan,
}) => {
  const byHand = [line, from].filter((text) => text && canWriteByHand(text))
  // ⛔ Both fonts are waited for here, with the pictures, BEFORE anything is measured: every
  // text is broken and sized by measuring it, and a canvas that does not have a font yet
  // measures the fallback. Every text the sheet sets goes in, the fixed ones too -- the text
  // decides which subsets of a font are fetched (printFont.js). Open Sans gets all of them: it
  // also draws what the handwriting lacks.
  const [logo, qr, image] = await Promise.all([
    loadImage(LOGO_PATH),
    renderQrCodeCanvas(link),
    picture ? loadImage(picture) : null,
    printFontReady([forWhom, line, words, from, waits, scan, free, slogan, ELLIPSIS]),
    handwritingReady(byHand.length ? [...byHand, ELLIPSIS] : []),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = THANK_YOU_GREETING_SHEET_WIDTH
  canvas.height = THANK_YOU_GREETING_SHEET_HEIGHT
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, THANK_YOU_GREETING_SHEET_WIDTH, THANK_YOU_GREETING_SHEET_HEIGHT)
  ctx.textAlign = 'left'
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const { words: inside, back, front } = THANK_YOU_GREETING_SHEET_PANELS
  inPanel(ctx, inside, () => drawInside(ctx, { forWhom, words }))
  // THANK_YOU_GREETING_SHEET_PANELS.hand stays as it is: the page for the sender's own hand.
  inPanel(ctx, back, () => drawBack(ctx, { qr, logo, from, waits, scan, free, slogan }))
  inPanel(ctx, front, () => drawFront(ctx, { picture: image, line }))
  drawFoldMarks(ctx)

  return canvas.toDataURL('image/png')
}

/**
 * The page the sheet is printed on: A4 without a margin, and on it ONE picture at the size of
 * the paper. The millimetres are what makes the folds meet the marks.
 */
const SHEET_STYLE = `
  @page { size: A4; margin: 0 }
  html, body { margin: 0; padding: 0; background: #fff }
  .sheet { box-sizing: border-box; width: 210mm; height: 297mm }
  .sheet img { width: 210mm; height: 297mm; display: block }
`

/**
 * Hand a drawn sheet to the browser's print dialogue, where "Save as PDF" is one click away.
 *
 * Takes the picture `drawThankYouGreetingSheet` made, so that what is printed and what is
 * saved are one drawing.
 *
 * @param {string} sheet a PNG data URL
 * @throws whatever the print frame throws; the caller decides what to say about it
 */
export const printThankYouGreetingSheet = (sheet) =>
  printSheet({
    style: SHEET_STYLE,
    build: (doc) => {
      const page = doc.createElement('div')
      page.className = 'sheet'
      const image = doc.createElement('img')
      image.src = sheet
      image.alt = ''
      page.appendChild(image)
      doc.body.appendChild(page)
    },
  })

// "Biglietto di ringraziamento per " and a name of forty characters come to 72: the label
// stands whole in every language of the wallet (the spec holds that).
const FILE_NAME_MAX_CHARS = 80

/**
 * The file name of a saved sheet, from the words the list of links calls the greeting by --
 * "Dank-Gruß für Sarah.png". Through the cheque's name builder, which knows what a file name
 * has to survive, and without an amount in front.
 *
 * @param {string} label "Dank-Gruß für Sarah", or "Dank-Gruß" without a name
 * @returns {string}
 */
export const thankYouGreetingSheetFileName = (label) =>
  chequeFileName(label, null, FILE_NAME_MAX_CHARS)

/**
 * A drawn sheet as a file, for the device's share sheet or as a download (`saveChatImageFile`).
 * The same bytes the print frame shows.
 *
 * @param {string} sheet a PNG data URL
 * @param {string} fileName
 * @returns {File}
 */
export const thankYouGreetingSheetFile = (sheet, fileName) => {
  const binary = atob(sheet.slice(sheet.indexOf(',') + 1))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return new File([bytes], fileName, { type: 'image/png' })
}

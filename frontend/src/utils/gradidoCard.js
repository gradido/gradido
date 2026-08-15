// AI-GENERATED — not an architecture reference

/**
 * Draws a member's Gradido card as a PNG.
 *
 * Layout (millimetres, converted to pixels at 300 dpi):
 *
 *   card 85.6 x 54 -- the size of a bank card, with a thin grey cutting line
 *   |- the name, and under it two labelled lines: community and user name
 *   |- the picture 24 (or an initials disc) on the left, the QR 28 on the right
 *   `- the address line at the bottom, under a hairline
 *
 * The two labelled lines are the point of the card, not decoration. They are exactly the
 * two inputs of the send form, which resolves a community by its name -- so whoever holds
 * the card can pay its owner today, by typing, from any wallet and without a single line
 * of new code. The address line under them is the same address in its durable form, and it
 * is what the QR carries; the QR carries it with the scheme, because without one many phone
 * cameras do not offer to open a link at all.
 *
 * No white margin here, unlike the thank-you cheque. That one gets pasted into letters and
 * text pages, where the margin keeps three of them on a page. A card is printed and cut.
 *
 * The QR is not built here. It arrives as a finished canvas from utils/qrCode.js -- the
 * same generator the modal uses, so what gets printed is the code the screen would show.
 *
 * ## No print density in the file, on purpose
 *
 * The pixel dimensions are 85.6 x 54 mm at 300 dpi, but the PNG carries no `pHYs` chunk that
 * would tell a program so, and it is not to be given one. `canvas.toDataURL()` cannot write
 * that chunk, so adding it means hand-writing a PNG chunk into the wallet -- and it was
 * measured on the thank-you cheque first: Word and LibreOffice honour the density, Google
 * Docs ignores it and stretches to column width regardless. Adding it therefore does not make
 * the size correct everywhere, it makes the same file come out at two different sizes
 * depending on the program.
 *
 * Uniform behaviour beats the exact measurement, and both printed objects have to behave the
 * same when they land in one document. The physical size is carried by the print hint next to
 * the button instead: place it, print at original size, cut.
 */

import { avatarPaletteEntry } from './avatarColor'
// The cheque's file-name sanitiser knows which characters Windows rejects and which names
// it reserves. Reused rather than copied: that knowledge should exist once.
import { chequeFileName } from './thankYouCheque'

const DPI = 300
const mm = (value) => Math.round((value * DPI) / 25.4)

const WIDTH = mm(85.6)
const HEIGHT = mm(54)
const PADDING = mm(3.2)

const NAME_SIZE = mm(4)
const NAME_BLOCK = Math.round(NAME_SIZE * 1.1)
const LINES_GAP = mm(1)
const LABEL_SIZE = mm(2.1)
const VALUE_SIZE = mm(2.8)
const ROW_HEIGHT = Math.round(VALUE_SIZE * 1.25)
const VALUE_OFFSET = mm(16.6) // label column plus the gap after it
const LOGO_HEIGHT = mm(4.4)

const BLOCK_GAP = mm(1.2)
const PICTURE = mm(24)
const QR_SIZE = mm(28)

const ADDRESS_SIZE = mm(2.9)
const ADDRESS_LINE = Math.round(ADDRESS_SIZE * 1.2)
const ADDRESS_PADDING = mm(1.2)
const HAIRLINE = 2

// The address line is the one thing on the card that has to be readable letter by letter,
// because it is what somebody types into their own wallet. Its length is not ours to choose:
// the community host can be long, and an account from before the user name became compulsory
// carries a 36-character Gradido ID where a name would stand. At a fixed size the line simply
// ran off the card -- `ki-playground.gradido.net/u/<gradido-id>` measures 1064 px where 935
// are available, so the last third was cut away. A cut address is a *wrong* address, and
// paper cannot be corrected. So the line shrinks until it fits.
//
// The floor is not reached by anything the system can produce. Aliases are capped at 20
// characters (VALID_ALIAS_REGEX), and measured: a 48-character host with a 20-character alias
// fits at 2.2 mm, a 34-character host with a 36-character Gradido ID likewise. It exists so
// that an absurd host makes the line small rather than making it vanish.
const ADDRESS_MIN_SIZE = mm(2.0)
const ADDRESS_WIDTH = WIDTH - 2 * PADDING

const FONT = '"Open Sans", Helvetica, Arial, sans-serif'

const COLOR_TEXT = 'rgb(56, 56, 56)'
const COLOR_LABEL = '#8a8a8a'
const COLOR_GREEN = '#4a6741'
const COLOR_HOST = '#4b4b4b'
const COLOR_HAIRLINE = '#e4e4e4'
const COLOR_CUT_LINE = '#a8a8a8'

const IMAGES = {
  logo: '/img/brand/gradido-logo.png',
  watermark: '/img/svg/Gradido_Blaetter_Mainpage.svg',
}

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`cannot load image: ${source}`))
    image.src = source
  })

// Canvas has no line box, so a baseline has to be placed by hand. 0.85 of the font size is
// close enough to the ascent of the fonts in use, and every block below is measured from
// its own top, so a small error never accumulates down the card.
const baselineOf = (top, fontSize) => top + Math.round(fontSize * 0.85)

/**
 * The file name of a downloaded card. The member's name leads, so a folder holding several
 * cards sorts by person.
 *
 * @param {string} name
 * @returns {string}
 */
export const cardFileName = (name) => {
  const person = String(name ?? '').trim()
  return chequeFileName(person ? `Gradido ${person}` : 'Gradido')
}

const drawPicture = (ctx, { image, initials, x, y }) => {
  const radius = PICTURE / 2
  if (image) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(image, x, y, PICTURE, PICTURE)
    ctx.restore()
    return
  }

  // No picture: the initials disc, exactly as the wallet draws it everywhere else. A dashed
  // empty ring is the wallet's way of inviting its owner to upload one -- on a card that is
  // handed away, the same shape reads as a gap, because the beholder is somebody else.
  const palette = avatarPaletteEntry(initials)
  ctx.beginPath()
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2)
  ctx.fillStyle = palette.bg
  ctx.fill()

  ctx.fillStyle = palette.text
  ctx.font = `500 ${Math.round(PICTURE * 0.4)}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(initials ?? '').toUpperCase(), x + radius, y + radius + 1)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

const drawLabelledLine = (ctx, { label, value, valueColor, top }) => {
  const baseline = baselineOf(top, VALUE_SIZE)

  ctx.fillStyle = COLOR_LABEL
  ctx.font = `400 ${LABEL_SIZE}px ${FONT}`
  ctx.fillText(label ?? '', PADDING, baseline)

  ctx.fillStyle = valueColor
  ctx.font = `600 ${VALUE_SIZE}px ${FONT}`
  ctx.fillText(value ?? '', PADDING + VALUE_OFFSET, baseline)
}

/**
 * The width the address line takes at a given size. Measured in the three pieces it is drawn
 * in and at the weights it is drawn with, because measuring the joined string would answer a
 * question that is not the one being asked -- the pieces are painted by separate calls, so
 * nothing kerns across their seams.
 */
const addressWidthAt = (ctx, size, host, alias) => {
  ctx.font = `400 ${size}px ${FONT}`
  const plain = ctx.measureText(host).width + ctx.measureText('/u/').width
  ctx.font = `700 ${size}px ${FONT}`
  return plain + ctx.measureText(alias).width
}

const addressSizeFor = (ctx, host, alias) => {
  let size = ADDRESS_SIZE
  while (size > ADDRESS_MIN_SIZE && addressWidthAt(ctx, size, host, alias) > ADDRESS_WIDTH) {
    size -= 1
  }
  return size
}

const drawAddress = (ctx, { host, alias, top }) => {
  ctx.fillStyle = COLOR_HAIRLINE
  ctx.fillRect(PADDING, top, WIDTH - 2 * PADDING, HAIRLINE)

  const hostText = host ?? ''
  const aliasText = alias ?? ''
  const size = addressSizeFor(ctx, hostText, aliasText)
  // The baseline is computed from the full size on purpose: a line that had to shrink must
  // fill less of its row, not move it.
  const baseline = baselineOf(top + HAIRLINE + ADDRESS_PADDING, ADDRESS_SIZE)
  let x = PADDING

  ctx.font = `400 ${size}px ${FONT}`
  ctx.fillStyle = COLOR_HOST
  ctx.fillText(hostText, x, baseline)
  x += ctx.measureText(hostText).width

  ctx.fillStyle = COLOR_LABEL
  ctx.fillText('/u/', x, baseline)
  x += ctx.measureText('/u/').width

  ctx.font = `700 ${size}px ${FONT}`
  ctx.fillStyle = COLOR_TEXT
  ctx.fillText(aliasText, x, baseline)
}

/**
 * @param {object} data
 * @param {HTMLCanvasElement} data.qrCanvas  the canvas the QR has already been drawn on
 * @param {string} data.name                 the member's name, in large type
 * @param {string} data.communityLabel       the word in front of the community line
 * @param {string} data.communityName        the community, as the send form spells it
 * @param {string} data.aliasLabel           the word in front of the user-name line
 * @param {string} data.alias                the user name
 * @param {string} data.host                 the community host, printed without a scheme
 * @param {string} data.initials             shown when there is no picture
 * @param {string} [data.picture]            the 512x512 crop as a data URI, if there is one
 * @returns {Promise<string>} the PNG as a data URL
 */
export const drawGradidoCard = async (data) => {
  const [logo, watermark, picture] = await Promise.all([
    loadImage(IMAGES.logo),
    loadImage(IMAGES.watermark),
    data.picture ? loadImage(data.picture) : Promise.resolve(null),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // The leaf, running out of the card at the bottom left, in its own pale grey
  const watermarkHeight = mm(46)
  const watermarkWidth = watermark.width * (watermarkHeight / watermark.height)
  ctx.drawImage(
    watermark,
    -mm(6),
    HEIGHT - watermarkHeight + mm(14),
    watermarkWidth,
    watermarkHeight,
  )

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  ctx.fillStyle = COLOR_TEXT
  ctx.font = `700 ${NAME_SIZE}px ${FONT}`
  ctx.fillText(data.name ?? '', PADDING, baselineOf(PADDING, NAME_SIZE))

  const logoWidth = logo.width * (LOGO_HEIGHT / logo.height)
  ctx.drawImage(logo, WIDTH - PADDING - logoWidth, PADDING, logoWidth, LOGO_HEIGHT)

  const firstRow = PADDING + NAME_BLOCK + LINES_GAP
  drawLabelledLine(ctx, {
    label: data.communityLabel,
    value: data.communityName,
    valueColor: COLOR_GREEN,
    top: firstRow,
  })
  drawLabelledLine(ctx, {
    label: data.aliasLabel,
    value: data.alias,
    valueColor: COLOR_TEXT,
    top: firstRow + ROW_HEIGHT,
  })

  const middleTop = firstRow + 2 * ROW_HEIGHT + BLOCK_GAP
  drawPicture(ctx, {
    image: picture,
    initials: data.initials,
    x: PADDING,
    y: middleTop + Math.round((QR_SIZE - PICTURE) / 2),
  })

  // The code arrives 296 pixels wide and is drawn at 28 mm, which is 331 -- so it is scaled
  // up by a tenth. Smoothing would blur every module edge, and a scanner reads soft edges
  // worse than hard ones, so it is turned off for this one draw. Whether the code is 296 or
  // 331 pixels does not matter; whether its edges are sharp does.
  const smoothing = ctx.imageSmoothingEnabled
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(data.qrCanvas, WIDTH - PADDING - QR_SIZE, middleTop, QR_SIZE, QR_SIZE)
  ctx.imageSmoothingEnabled = smoothing

  drawAddress(ctx, {
    host: data.host,
    alias: data.alias,
    top: HEIGHT - PADDING - HAIRLINE - ADDRESS_PADDING - ADDRESS_LINE,
  })

  // Cutting line last so that nothing paints over it
  ctx.strokeStyle = COLOR_CUT_LINE
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, WIDTH - 2, HEIGHT - 2)

  return canvas.toDataURL('image/png')
}

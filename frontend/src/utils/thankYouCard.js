// AI-GENERATED — not an architecture reference

import { renderQrCodeCanvas } from './qrCode'
import { chequeFileName } from './thankYouCheque'

/**
 * The printed thank you card: portrait, 54 x 85.6 mm at 300 dpi.
 *
 * ## Why portrait, when the business card is landscape
 *
 * Both are cheque-card sized, and two cards of the same shape are indistinguishable by hand
 * in a wallet. What has to be told apart here is told apart in the dark, by feel, while
 * somebody is being handed a coffee -- so the difference has to be the SHAPE, not the
 * colour. Turning it costs nothing and is the only distinction that survives a black wallet.
 *
 * ## Why the QR sits at the bottom
 *
 * A card standing in a slot is pulled out from the top, and fingers land on whatever is up
 * there. The same move answers a second question nobody asked: what is at the top is what
 * shows above the edge, so the top is where the things live that help find the right card.
 *
 * ## What the head has to answer, in this order
 *
 *   1. Is this Gradido at all?      -> the logo, recognised without reading
 *   2. Which kind of Gradido card?  -> "Dank-Karte", between two gold lines
 *   3. Which of my cards?           -> the label
 *
 * The community name is not a finding aid, so it goes under the QR.
 *
 * ## No solid areas, anywhere
 *
 * This is printed at home on an inkjet, not at a print shop, where a filled band bleeds. The
 * two hairlines do what a gold band would have done -- give the head an edge that is visible
 * in a stack -- without any area to bleed.
 *
 * ⛔ It carries no name, no picture and no Gradido address. A found card is then a code
 * whose owner is not written on it, and the business card next to it in the same wallet is
 * the one that introduces somebody.
 */

const DPI = 300
const mm = (value) => Math.round((value * DPI) / 25.4)

const WIDTH = mm(54)
const HEIGHT = mm(85.6)
const PADDING = mm(5)

const LOGO_HEIGHT = mm(6)
const TITLE_SIZE = mm(3.4)
const LABEL_SIZE = mm(4.6)
const COMMUNITY_SIZE = mm(2.6)
const HAIRLINE = Math.max(2, mm(0.25))

const FONT = '"Open Sans", Helvetica, Arial, sans-serif'
const COLOR_TEXT = 'rgb(56, 56, 56)'
const COLOR_GOLD = '#c58d38'
const COLOR_MUTED = '#8a8a8a'
const COLOR_BORDER = '#d8d8d8'

const LOGO_PATH = '/img/brand/gradido-logo.png'

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`cannot load image: ${source}`))
    image.src = source
  })

// Canvas has no line box, so a baseline is placed by hand. 0.85 of the font size is close
// enough to the ascent of the fonts in use, and every block is measured from its own top.
const baselineOf = (top, fontSize) => top + Math.round(fontSize * 0.85)

/**
 * The file name of a downloaded card. The label leads, so somebody who has had several over
 * the years gets a folder that sorts by card rather than by date.
 *
 * ★ Reuses the cheque's name builder rather than inventing a second one. It already handles
 * what a file name has to survive -- characters Windows forbids, reserved device names,
 * trailing dots -- and a private copy of those rules would drift from it the first time
 * somebody learns something new about file names.
 *
 * @param {string} label
 * @returns {string}
 */
export const thankYouCardFileName = (label) => {
  const name = String(label ?? '').trim()
  return chequeFileName(name ? `Dank-Karte ${name}` : 'Dank-Karte')
}

/**
 * Draw the card and return it as a PNG data URL.
 *
 * @param {object} options
 * @param {string} options.url       what the QR code points at, `host/dk/CODE`
 * @param {string} options.label     the owner's own word for this card
 * @param {string} options.community the community name, printed under the code
 * @param {string} options.title     the words "Dank-Karte" in the reader's language
 * @returns {Promise<string>} a PNG data URL
 */
export const drawThankYouCard = async ({ url, label, community, title }) => {
  const [logo, qr] = await Promise.all([loadImage(LOGO_PATH), renderQrCodeCanvas(url)])

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // --- the head -------------------------------------------------------------------
  const logoWidth = logo.width * (LOGO_HEIGHT / logo.height)
  ctx.drawImage(logo, Math.round((WIDTH - logoWidth) / 2), PADDING, logoWidth, LOGO_HEIGHT)

  const rulesTop = PADDING + LOGO_HEIGHT + mm(4)
  const titleBlock = TITLE_SIZE + mm(2.4)

  ctx.fillStyle = COLOR_GOLD
  ctx.fillRect(PADDING, rulesTop, WIDTH - 2 * PADDING, HAIRLINE)
  ctx.fillRect(PADDING, rulesTop + titleBlock, WIDTH - 2 * PADDING, HAIRLINE)

  ctx.font = `600 ${TITLE_SIZE}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.fillStyle = COLOR_GOLD
  ctx.fillText(
    String(title).toUpperCase(),
    Math.round(WIDTH / 2),
    baselineOf(rulesTop + mm(1.2), TITLE_SIZE),
  )

  const labelTop = rulesTop + titleBlock + mm(5)
  ctx.font = `700 ${LABEL_SIZE}px ${FONT}`
  ctx.fillStyle = COLOR_TEXT
  ctx.fillText(label, Math.round(WIDTH / 2), baselineOf(labelTop, LABEL_SIZE))

  // --- the code, at the bottom, below where fingers land --------------------------
  const communityBaseline = HEIGHT - PADDING
  const qrSize = mm(34)
  const qrTop = communityBaseline - COMMUNITY_SIZE - mm(3) - qrSize

  ctx.drawImage(qr, Math.round((WIDTH - qrSize) / 2), qrTop, qrSize, qrSize)

  ctx.font = `${COMMUNITY_SIZE}px ${FONT}`
  ctx.fillStyle = COLOR_MUTED
  ctx.fillText(community, Math.round(WIDTH / 2), communityBaseline)

  // A cut line, as on the business card: printed at home on plain paper, so somebody has to
  // see where to cut.
  ctx.strokeStyle = COLOR_BORDER
  ctx.lineWidth = 1
  ctx.strokeRect(1, 1, WIDTH - 2, HEIGHT - 2)

  return canvas.toDataURL('image/png')
}

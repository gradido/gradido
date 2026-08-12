// AI-GENERATED — not an architecture reference

/**
 * Draws a thank-you cheque or a starting-bonus cheque as a PNG.
 *
 * Layout (pixels at 300 dpi):
 *
 *   image  1783 x 850  =  151 x 72 mm
 *   |- white margin 106 px (9 mm) on the left and on the right
 *   `- cheque 1571 x 850  =  133 x 72 mm, with a thin grey cutting line
 *      |- header 150 px: logo, leaves, sender or community
 *      `- body   700 px: leaf watermark, text on the left, QR on the right
 *
 * The white margin serves two purposes. It makes the image flat enough for three
 * cheques to fit on one text page — applications that ignore the print size
 * stretch the image to column width, which shrinks the cheque instead of making
 * it taller. And it indents a single cheque placed inside the text of an
 * invitation letter.
 *
 * The QR is not built here. It arrives as a finished canvas: the wallet hands in the
 * one that is already on screen, and the admin renders one off screen, because its
 * button sits in a table row where no code is showing. Both keep the settings in a
 * single place of their own, so what gets printed is the code the screen shows.
 *
 * This file exists twice, once in the wallet and once in the admin, because the
 * two applications share no code. The copies are byte-identical and a test keeps
 * them that way: admin/src/utils/thankYouCheque.spec.js fails as soon as they
 * drift apart. Change the cheque here and copy the file over, or the printed
 * starting bonus stops looking like the printed thank-you cheque.
 */

const WIDTH = 1783
const HEIGHT = 850
const MARGIN = 106 // 9 mm of white on each side
const CHEQUE_WIDTH = WIDTH - 2 * MARGIN
const HEADER = 150
const BODY = HEIGHT - HEADER
const PADDING = 55 // inner padding of the cheque
const QR_BOX = 360 // fixed box width so the QR looks the same for any link length
const QR_GAP = 40

const FONT = '"Open Sans", Helvetica, Arial, sans-serif'
const HEADLINE_SIZE = 62
const MEMO_SIZE = 38
const MEMO_GAP = 32 // baseline to baseline, measured against the approved mockup
const FOOTER_SIZE = 29
const MEMO_MAX_LINES = 2
const BLOCK_GAP = 20
const PADDING_MIN = 24

const COLOR_TEXT = 'rgb(56, 56, 56)'
const COLOR_MEMO = '#4b4b4b'
const COLOR_GREEN = '#4a6741'
const COLOR_HEADER_BG = '#f5f5f5'
const COLOR_CUT_LINE = '#a8a8a8'
const COLOR_AVATAR = '#5b7c99'

const IMAGES = {
  logo: '/img/brand/gradido-logo.png',
  leaves: '/img/template/Blaetter.png',
  watermark: '/img/svg/Gradido_Blaetter_Mainpage.svg',
}

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`cannot load image: ${source}`))
    image.src = source
  })

/**
 * Wraps text at word boundaries and truncates after `maxLines` with an ellipsis.
 * Canvas does not wrap on its own, so every line has to be drawn separately.
 */
export const wrapText = (ctx, text, maxWidth, maxLines = Infinity) => {
  const words = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  if (!words.length) return []

  const lines = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
    if (lines.length === maxLines) break
  }
  if (lines.length < maxLines) lines.push(current)

  const truncated = lines.length === maxLines && lines.join(' ') !== words.join(' ')
  if (truncated) {
    let last = lines[maxLines - 1]
    while (last && ctx.measureText(`${last} …`).width > maxWidth) {
      last = last.replace(/\s*\S+$/, '')
    }
    lines[maxLines - 1] = `${last.replace(/[\s,;:–-]+$/, '')} …`
  }
  return lines
}

// Characters Windows rejects in file names, plus control characters. Spaces and
// hyphens are kept on purpose so that "Dank-Scheck" keeps its hyphen.
// eslint-disable-next-line no-control-regex
const WINDOWS_FORBIDDEN = /[<>:"/\\|?*\u0000-\u001f]/g
const WINDOWS_RESERVED = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  ...Array.from({ length: 9 }, (_, i) => `COM${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `LPT${i + 1}`),
])

/**
 * Builds the file name from whichever field names the occasion: the memo for a
 * thank-you cheque, the contribution link's name for a starting bonus. The amount
 * goes first so that a folder holding several cheques sorts in a useful way.
 *
 * Windows forbids more characters than macOS does and rejects names ending in a
 * dot or a space. Both are handled here, otherwise the download fails silently.
 */
export const chequeFileName = (occasion, amount, maxChars = 50) => {
  let name = String(occasion ?? '')
    .replace(WINDOWS_FORBIDDEN, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (name.length > maxChars) {
    const atWordEnd = name.slice(0, maxChars).replace(/\s+\S*$/, '')
    name = (atWordEnd.length >= maxChars * 0.6 ? atWordEnd : name.slice(0, maxChars)).replace(
      /[\s,;:–-]+$/,
      '',
    )
  }
  name = name.replace(/[\s.]+$/, '')

  if (!name || WINDOWS_RESERVED.has(name.toUpperCase())) name = 'Gradido-Scheck'
  const prefix = amount ? `${amount} GDD - ` : ''
  return `${prefix}${name}.png`
}

const drawHeader = (ctx, { logo, leaves, kind, name, address, initials, community }) => {
  ctx.fillStyle = COLOR_HEADER_BG
  ctx.fillRect(MARGIN, 0, CHEQUE_WIDTH, HEADER)
  ctx.fillStyle = '#e4e4e4'
  ctx.fillRect(MARGIN, HEADER - 2, CHEQUE_WIDTH, 2)

  const leavesHeight = 212
  const leavesWidth = leaves.width * (leavesHeight / leaves.height)
  ctx.drawImage(leaves, MARGIN + (CHEQUE_WIDTH - leavesWidth) / 2, -30, leavesWidth, leavesHeight)

  const logoHeight = 70
  const logoWidth = logo.width * (logoHeight / logo.height)
  ctx.drawImage(logo, MARGIN + 46, (HEADER - logoHeight) / 2, logoWidth, logoHeight)

  const right = WIDTH - MARGIN - 46
  ctx.textAlign = 'right'
  ctx.fillStyle = COLOR_GREEN

  if (kind === 'startingBonus') {
    ctx.font = `700 29px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.fillText(community ?? '', right, HEADER / 2)
  } else {
    ctx.font = `700 25px ${FONT}`
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(name ?? '', right, HEADER / 2 - 4)
    ctx.font = `400 24px ${FONT}`
    ctx.fillText(address ?? '', right, HEADER / 2 + 30)

    const size = 78
    ctx.font = `400 24px ${FONT}`
    const addressWidth = ctx.measureText(address ?? '').width
    ctx.font = `700 25px ${FONT}`
    const nameWidth = ctx.measureText(name ?? '').width
    const centerX = right - Math.max(nameWidth, addressWidth) - 20 - size / 2
    ctx.beginPath()
    ctx.arc(centerX, HEADER / 2, size / 2, 0, Math.PI * 2)
    ctx.fillStyle = COLOR_AVATAR
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `600 29px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials ?? '', centerX, HEADER / 2 + 1)
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

/**
 * @param {object} data
 * @param {HTMLCanvasElement} data.qrCanvas the canvas the QR has already been drawn on
 * @param {'thankYou'|'startingBonus'} data.kind
 * @param {string} data.headline  "Bernd sends you 20 Gradido." or "Starting bonus 20 Gradido"
 * @param {string} data.memo      free text, truncated to two lines
 * @param {string} data.hintLine  "... scan the QR code!"
 * @param {string} data.validLine "... is valid until 26.08.2026."
 * @returns {Promise<string>} the PNG as a data URL
 */
export const drawCheque = async (data) => {
  const [logo, leaves, watermark] = await Promise.all([
    loadImage(IMAGES.logo),
    loadImage(IMAGES.leaves),
    loadImage(IMAGES.watermark),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  drawHeader(ctx, { logo, leaves, ...data })

  // Leaf watermark at 125 % of the body height, aligned to the top and placed to
  // the left of the QR. It runs out of the image at the bottom on purpose, which
  // keeps both leaf tips visible.
  ctx.save()
  ctx.beginPath()
  ctx.rect(MARGIN, HEADER, CHEQUE_WIDTH, BODY)
  ctx.clip()
  const watermarkHeight = BODY * 1.25
  const watermarkWidth = watermark.width * (watermarkHeight / watermark.height)
  ctx.drawImage(
    watermark,
    WIDTH - MARGIN - 425 - watermarkWidth,
    HEADER,
    watermarkWidth,
    watermarkHeight,
  )
  ctx.restore()

  const qrSize = Math.min(data.qrCanvas.width, QR_BOX)
  const column = CHEQUE_WIDTH - 2 * PADDING - QR_BOX - QR_GAP

  ctx.font = `600 ${MEMO_SIZE}px ${FONT}`
  const memoLines = wrapText(ctx, data.memo, column, MEMO_MAX_LINES)

  const topBlock =
    Math.round(HEADLINE_SIZE * 1.2) + (memoLines.length ? MEMO_GAP : 0) + memoLines.length * 49
  const spare = Math.max(2 * PADDING_MIN, BODY - topBlock - qrSize - BLOCK_GAP)
  const paddingTop = Math.round(spare * 0.55)

  const left = MARGIN + PADDING
  let y = HEADER + paddingTop + HEADLINE_SIZE

  ctx.fillStyle = COLOR_TEXT
  ctx.font = `700 ${HEADLINE_SIZE}px ${FONT}`
  ctx.fillText(data.headline ?? '', left, y)

  ctx.fillStyle = COLOR_MEMO
  ctx.font = `600 ${MEMO_SIZE}px ${FONT}`
  y += MEMO_GAP + MEMO_SIZE
  memoLines.forEach((line, i) => ctx.fillText(line, left, y + i * 49))

  // QR at the bottom right, centred inside a box of fixed width
  const qrX = WIDTH - MARGIN - PADDING - QR_BOX + (QR_BOX - qrSize) / 2
  const qrY = HEIGHT - Math.round(spare * 0.45) - qrSize
  ctx.drawImage(data.qrCanvas, qrX, qrY, qrSize, qrSize)

  // Footer lines on the left, aligned with the bottom of the QR and drawn from
  // the bottom up. The web address sits a little lower than the rest.
  ctx.fillStyle = COLOR_TEXT
  ctx.font = `700 ${FOOTER_SIZE}px ${FONT}`
  const lineHeight = Math.round(FOOTER_SIZE * 1.6)
  const webGap = 22
  const bottom = qrY + qrSize - 15

  ctx.fillText('www.gradido.net', left, bottom)
  ctx.fillText(data.validLine ?? '', left, bottom - lineHeight - webGap)
  ctx.fillText(data.hintLine ?? '', left, bottom - 2 * lineHeight - webGap)

  // Cutting line last so that nothing paints over it
  ctx.strokeStyle = COLOR_CUT_LINE
  ctx.lineWidth = 2
  ctx.strokeRect(MARGIN + 1, 1, CHEQUE_WIDTH - 2, HEIGHT - 2)

  return canvas.toDataURL('image/png')
}

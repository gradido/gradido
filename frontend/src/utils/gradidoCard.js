// AI-GENERATED — not an architecture reference

/**
 * Draws a member's Gradido card as a PNG.
 *
 * Layout (millimetres, converted to pixels at 300 dpi):
 *
 *   card 85.6 x 54 -- the size of a bank card, with a thin grey cutting line
 *   |- the name, and under it the labelled lines: community, and the user name unless the
 *   |  member prints no real name -- then the alias IS the name line and the second one goes
 *   |- the picture 20 (or an initials disc) on the left, the QR on the right, and
 *   |  between them the contact block: a heading and up to five lines the member types
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
 * ## The contact lines, and why they are free-form
 *
 * They are the only thing on the card whose content we do not know: an e-mail address, a
 * phone number, a messenger handle, a website, nothing. Deciding what a way to reach
 * somebody is would be our judgement to make, and it is not -- so the lines carry no
 * labels of their own, only the one heading above them.
 *
 * They are typed for a print run rather than stored on the server. That is what makes a
 * printed card a decision per recipient instead of a setting made in advance, and it is
 * why nothing here needs a release switch: printing is the release.
 *
 * ## Every piece of text on the card has a rule for fitting -- including the name
 *
 * The name was the exception until 27.08.2026: drawn at a fixed 4 mm with no clip, so a long
 * one ran into the logo and then over the edge. Measured in a browser with Open Sans loaded,
 * a 29-character name was already touching the logo and a 39-character one was 255 px past
 * the card. It now shrinks like the address line does, down to the size of the community
 * line beneath it and no further -- and is clipped to its room like the contact block, for
 * the names past about 42 characters that the floor cannot save. Shrinking is the rule and
 * the clip is the backstop; neither alone covers the case.
 *
 * ## The QR size follows the address, it is not a fixed number
 *
 * What decides whether a code can be read is the edge length of one *module*, not of the
 * whole code -- and how many modules there are depends on how long the address is. It
 * runs from 33 across for `gradido.net/u/eva` to 49 for a long community with a long
 * name. A code of one fixed width therefore means one member gets 0.73 mm per module and
 * another 0.49, which is the difference between a code that reads at arm's length and one
 * that does not. Paper cannot be corrected afterwards.
 *
 * So the code is drawn at its own natural size, capped at QR_MAX -- which makes its width
 * follow the address by itself: a short address leaves a narrower code, and the room that
 * frees goes to the contact lines beside it. Nobody falls below what was tested; the
 * longest addresses keep the 28 mm they have today, the shorter ones gain sharpness.
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
/**
 * How small the name may become.
 *
 * The same idea as the address line at the foot: shrink until it fits, because a name that
 * runs off the card is a card nobody can print, and paper cannot be corrected. What is new
 * is only that it applies up here too -- the name was the ONE piece of text on the card
 * without a rule of its own, drawn at a fixed size with no clip, so a long one ran into the
 * logo and then over the edge.
 *
 * Measured in a real browser with Open Sans actually loaded (27.08.2026), at 300 dpi and
 * against the 744 px this leaves beside the logo:
 *
 *   Bernd Hückstädt                          396 px  -- half the room
 *   Christiane Schmidt-Wellenkamp            755 px  -- was already touching the logo
 *   Maximiliane von Sonnenberg-Hohenzollern 1013 px  -- ran off the card
 *   8f3a1c7e-…-1e5a2b8d3f40 (a Gradido ID)   914 px  -- reachable since the card can be
 *                                                      printed without the real name
 *
 * ⛔ The floor is VALUE_SIZE, not a number picked for looks: the name must never end up
 * smaller than the community line underneath it, or it stops reading as the heading of the
 * card. A name past about 41 characters therefore still overflows -- the same trade the
 * address line makes, and for the same reason: too small to read helps nobody either.
 */
const NAME_MIN_SIZE = mm(2.8)
// Air between the name and the logo in the opposite corner. Without it the longest names
// that still "fit" end flush against it, which reads as a mistake rather than as a full line.
const NAME_LOGO_GAP = mm(1.2)
const LINES_GAP = mm(1)
const LABEL_SIZE = mm(2.1)
const VALUE_SIZE = mm(2.8)
const ROW_HEIGHT = Math.round(VALUE_SIZE * 1.25)
const VALUE_OFFSET = mm(16.6) // label column plus the gap after it
const LOGO_HEIGHT = mm(4.4)

const BLOCK_GAP = mm(1.2)
const PICTURE = mm(20)

// The band that holds picture, contact lines and QR. It keeps its height whatever the QR
// measures, so the rest of the card does not move when a shorter address makes the code
// smaller. The one thing that does change it is a card printed without the user-name line:
// then the band takes that row as well, rather than leaving a hole where the line stood.
const MIDDLE_ROW = mm(28)

// The widest the code may ever be. 28 mm is the size that was tested on paper and read;
// P-018 in the project notes holds it there.
const QR_MAX = mm(28)

// utils/qrCode.js draws one module as an 8 x 8 block (`cellSize: 8`), so the canvas that
// arrives here is always `modules * 8` pixels wide -- and at 300 dpi those 8 pixels are
// 0.677 mm, comfortably above what a phone camera needs off paper. That is what makes
// "draw it at its own size" the right default rather than a coincidence.
// A test holds this number against the generator's own options.
export const QR_SOURCE_CELL = 8

const CONTACT_GAP = mm(1.6)
const CONTACT_HEADING_SIZE = mm(2.1)
const CONTACT_SIZE = mm(2.4)
const CONTACT_LINE = Math.round(CONTACT_SIZE * 1.45)
const CONTACT_HEADING_LINE = Math.round(CONTACT_HEADING_SIZE * 1.45)
// Below this nothing is read at arm's length any more. A line that would need it is
// clipped instead -- but nothing the field allows gets anywhere near.
const CONTACT_MIN_SIZE = mm(1.7)
// Five fit the column with room to spare; the limit is what still looks calm on a card,
// not what fits. The field says so, and anything beyond is dropped here as well, so a
// pasted address book cannot push the block past the QR.
export const CONTACT_MAX_LINES = 5

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

const drawPicture = (ctx, { image, initials, colorSeed, x, y }) => {
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
  //
  // ⛔ Letters and colour come from two different places, and that is decision AS-010, not
  // an oversight: the letters follow the line the disc stands next to (the real initials
  // while the card carries the real name, the alias once it does not), and the colour keeps
  // hashing the real initials so that nobody's disc changes colour when they hide their
  // name. The cheque does the same, for the same reason.
  const palette = avatarPaletteEntry(colorSeed ?? initials)
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
 * How wide the code is drawn, in pixels.
 *
 * The code is never scaled up and never drawn wider than QR_MAX. Both halves matter, and
 * the second one is why this is not simply "as large as fits":
 *
 * - Not scaled up. At 300 dpi a source module of 8 pixels is 0.677 mm, and every address
 *   short enough to stay under QR_MAX is therefore drawn 1:1 -- no resampling at all,
 *   every module exactly as wide as its neighbours. That is sharper than what came out
 *   before, where a 296-pixel code was stretched to 331 and its modules alternated
 *   between 8 and 9 pixels.
 * - Still capped. The longest addresses (a long community with a long name: 49 modules
 *   across) would want 33 mm, and there is neither room for that nor a reason -- 28 mm
 *   was read on paper. They keep the full 28 mm, exactly as before this change, which
 *   leaves them at 0.57 mm per module rather than 0.68.
 *
 * ⚠️ The first draft of this shrank the long case to 24.9 mm to keep the modules even,
 * and that got the trade backwards: a code fails from being too small long before it
 * fails from a one-pixel difference in module width. Size first, evenness where it is
 * free.
 *
 * @param {{width: number}} qrCanvas
 * @returns {number}
 */
export const qrSizeFor = (qrCanvas) => {
  const modules = Math.max(1, Math.round((qrCanvas?.width ?? 0) / QR_SOURCE_CELL))
  return Math.min(QR_MAX, modules * QR_SOURCE_CELL)
}

/**
 * The size the name is drawn at: full size unless it does not fit beside the logo.
 *
 * ⚠️ The baseline is NOT recomputed from it. A name that had to shrink fills less of its
 * row, it does not move it -- the same rule the address line and the contact lines follow.
 */
const nameSizeFor = (ctx, name, width) => {
  let size = NAME_SIZE
  ctx.font = `700 ${size}px ${FONT}`
  while (size > NAME_MIN_SIZE && ctx.measureText(name).width > width) {
    size -= 1
    ctx.font = `700 ${size}px ${FONT}`
  }
  return size
}

/**
 * The size a contact line is drawn at.
 *
 * The same idea as the address line below: shrink until it fits rather than cut. A cut
 * contact line is a wrong contact line, and on paper it cannot be corrected.
 */
const contactSizeFor = (ctx, text, width) => {
  let size = CONTACT_SIZE
  ctx.font = `400 ${size}px ${FONT}`
  while (size > CONTACT_MIN_SIZE && ctx.measureText(text).width > width) {
    size -= 1
    ctx.font = `400 ${size}px ${FONT}`
  }
  return size
}

const drawContact = (ctx, { heading, lines, left, width, top, height }) => {
  if (!lines.length || width <= 0) return

  const blockHeight = (heading ? CONTACT_HEADING_LINE : 0) + lines.length * CONTACT_LINE
  let top_ = top + Math.round((height - blockHeight) / 2)

  // The clip is the last resort behind the shrinking above: whatever a member manages to
  // type, nothing may paint over the QR, because that would cost the code its meaning
  // rather than a line its legibility.
  ctx.save()
  ctx.beginPath()
  ctx.rect(left, top, width, height)
  ctx.clip()

  if (heading) {
    ctx.fillStyle = COLOR_LABEL
    ctx.font = `400 ${CONTACT_HEADING_SIZE}px ${FONT}`
    ctx.fillText(heading, left, baselineOf(top_, CONTACT_HEADING_SIZE))
    top_ += CONTACT_HEADING_LINE
  }

  ctx.fillStyle = COLOR_HOST
  for (const line of lines) {
    const size = contactSizeFor(ctx, line, width)
    ctx.font = `400 ${size}px ${FONT}`
    // The baseline is computed from the full size on purpose, as with the address: a line
    // that had to shrink fills less of its row, it does not move it.
    ctx.fillText(line, left, baselineOf(top_, CONTACT_SIZE))
    top_ += CONTACT_LINE
  }

  ctx.restore()
}

/**
 * The lines as they will be printed: emptiness removed, the limit applied.
 *
 * Done here rather than trusted to the caller, so a card can never carry more than the
 * column holds however it was called.
 */
export const contactLines = (lines) =>
  (Array.isArray(lines) ? lines : [])
    .map((line) => String(line ?? '').trim())
    .filter(Boolean)
    .slice(0, CONTACT_MAX_LINES)

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
 * @param {boolean} [data.showAliasLine]     false leaves the user-name line off the card
 * @param {string} data.host                 the community host, printed without a scheme
 * @param {string} data.initials             shown when there is no picture
 * @param {string} [data.colorSeed]          what the disc's colour hashes, if not the letters
 * @param {string} [data.picture]            the crop as a data URI, if there is one
 * @param {string} [data.contactHeading]     the word above the contact lines
 * @param {string[]} [data.contact]          up to five lines the member typed
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

  // The logo first, because the room left for the name is what it does not take. Its width
  // comes from the loaded image rather than from a constant, so a different logo cannot
  // quietly make the name overlap it.
  const logoWidth = logo.width * (LOGO_HEIGHT / logo.height)
  ctx.drawImage(logo, WIDTH - PADDING - logoWidth, PADDING, logoWidth, LOGO_HEIGHT)

  const nameText = data.name ?? ''
  const nameRoom = WIDTH - 2 * PADDING - logoWidth - NAME_LOGO_GAP
  ctx.fillStyle = COLOR_TEXT
  ctx.font = `700 ${nameSizeFor(ctx, nameText, nameRoom)}px ${FONT}`
  // ⛔ The clip is the last resort behind the shrinking, exactly as it is for the contact
  // block: `nameSizeFor` stops at its floor whether or not the text fits, so a name past
  // about 42 characters is still too wide -- and this now paints AFTER the logo, because the
  // room it may use is what the logo does not take. Without the clip such a name would run
  // straight across the brand mark and off the card.
  //
  // ⚠️ This does not depend on paint order, and that is the point. Before the shrinking
  // existed, an over-long name was hidden by the logo being drawn on top of it afterwards --
  // containment by accident, from a line whose order nobody could change safely.
  ctx.save()
  ctx.beginPath()
  ctx.rect(PADDING, PADDING, nameRoom, NAME_BLOCK)
  ctx.clip()
  ctx.fillText(nameText, PADDING, baselineOf(PADDING, NAME_SIZE))
  ctx.restore()

  const firstRow = PADDING + NAME_BLOCK + LINES_GAP
  drawLabelledLine(ctx, {
    label: data.communityLabel,
    value: data.communityName,
    valueColor: COLOR_GREEN,
    top: firstRow,
  })
  // ⛔ Left off when the member prints no real name. The alias then stands in the name's
  // place at the top, and a labelled line repeating it two lines below would say the same
  // word twice -- which is what makes this a missing line rather than an empty one.
  const showAliasLine = data.showAliasLine !== false
  if (showAliasLine) {
    drawLabelledLine(ctx, {
      label: data.aliasLabel,
      value: data.alias,
      valueColor: COLOR_TEXT,
      top: firstRow + ROW_HEIGHT,
    })
  }

  // The freed row goes to the band below rather than staying a hole under the community
  // line: picture, contact block and QR keep their sizes, stay centred and simply gain a
  // little air, and the address line keeps its place at the foot of the card. Nothing about
  // the QR changes -- its size follows the address and is capped at QR_MAX, never at the
  // height of the band it sits in.
  const labelledLines = showAliasLine ? 2 : 1
  const middleTop = firstRow + labelledLines * ROW_HEIGHT + BLOCK_GAP
  const middleRow = MIDDLE_ROW + (2 - labelledLines) * ROW_HEIGHT
  drawPicture(ctx, {
    image: picture,
    initials: data.initials,
    colorSeed: data.colorSeed,
    x: PADDING,
    y: middleTop + Math.round((middleRow - PICTURE) / 2),
  })

  const qrSize = qrSizeFor(data.qrCanvas)
  const qrLeft = WIDTH - PADDING - qrSize

  drawContact(ctx, {
    heading: data.contactHeading,
    lines: contactLines(data.contact),
    left: PADDING + PICTURE + CONTACT_GAP,
    width: qrLeft - CONTACT_GAP - (PADDING + PICTURE + CONTACT_GAP),
    top: middleTop,
    height: middleRow,
  })

  // Smoothing off: a scanner reads hard module edges better than soft ones. It is safe to
  // turn off here precisely because qrSizeFor draws whole source pixels per module -- the
  // module edges of source and destination fall on each other, so nearest-neighbour has
  // nothing to choose and every module comes out the same width.
  const smoothing = ctx.imageSmoothingEnabled
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    data.qrCanvas,
    qrLeft,
    middleTop + Math.round((middleRow - qrSize) / 2),
    qrSize,
    qrSize,
  )
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

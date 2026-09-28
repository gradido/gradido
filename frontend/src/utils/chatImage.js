// AI-GENERATED — not an architecture reference
import {
  AVATAR_QUALITY_STEPS,
  AVATAR_SOURCE_MAX_BYTES,
  encodeUnderTarget,
  isHeicFileName,
} from '@/utils/avatarImage'

// A picture in a chat message (P7) is made small here, in the browser, before it goes anywhere
// (E-041, E-046): the server gets a finished JPEG as base64 in one mutation, the way the avatar
// goes (P-011), and never an original.
//
// ★ The re-encoding is also what keeps a phone photo's EXIF data -- the GPS position among it --
// off the server: the canvas carries pixels only, and the JPEG it writes has no EXIF at all
// (P-011: whoever uploads originals sends their members' home addresses along, unnoticed).

// One size for every picture, in the community and across its border (E-046): a picture travels
// to another community inside the encrypted command, and that one is taken up to 100 KB. The
// server takes up to 35 KB (CHAT_IMAGE_MAX_BYTES in `shared`); the target leaves the room the
// avatar's 55 against 60 KB leaves.
export const CHAT_IMAGE_TARGET_BYTES = 32 * 1024

// The measure is the AREA of 800 x 600 (E-041), not a longest side: a portrait, a landscape and a
// square get the same number of pixels, and a tall screenshot is not squeezed into a strip -- with a
// longest side of 800 a screenshot of 1072 x 3326 would be 258 pixels wide and its writing
// unreadable; by area it is 393 x 1220.
export const CHAT_IMAGE_AREA = 800 * 600

// The server's bound on each side (CHAT_IMAGE_MAX_SIDE in `shared`, held by ChatImageInput). At
// the area above only a panorama longer than about 35 : 1 reaches it; such a one is drawn smaller
// still, whole, rather than refused by the server.
export const CHAT_IMAGE_MAX_SIDE = 4096

// Where even the lowest quality does not bring a picture under the target, the next size is the
// area times 0.8 (E-041: a size smaller rather than over the limit -- the avatar sends its lowest
// step and leaves the rest to the server; for a chat picture that would be an error message). At
// most five sizes, the last about 512 x 384; a picture that does not fit even then is refused here.
export const CHAT_IMAGE_SHRINK = 0.8
export const CHAT_IMAGE_ROUNDS = 5

/**
 * Why a picture could not be made ready -- one reason for each of the bar's own sentences:
 * the file is larger than a phone's camera original can be, the browser cannot open it (an
 * iPhone's HEIC named on its own), or it does not come under the target even at the smallest size.
 */
export class ChatImageError extends Error {
  /** @param {'SOURCE_TOO_LARGE' | 'HEIC' | 'FORMAT' | 'NOT_SMALL_ENOUGH'} problem */
  constructor(problem) {
    super(`CHAT_IMAGE_${problem}`)
    this.name = 'ChatImageError'
    this.problem = problem
  }
}

/**
 * The size a picture is drawn at, in whole pixels: its own proportions, the area given (the
 * first round's, or a smaller one), never larger than it is, and no side past the server's bound.
 *
 * ⛔ Fitted, never cropped (E-041): a chat picture has no frame it must fill. Whoever wants a
 * part of a photo cuts it on the phone, before it comes here.
 */
export const chatImageSize = (width, height, area = CHAT_IMAGE_AREA) => {
  const scale = Math.min(
    1,
    Math.sqrt(area / (width * height)),
    CHAT_IMAGE_MAX_SIDE / width,
    CHAT_IMAGE_MAX_SIDE / height,
  )
  const side = (length) => Math.min(CHAT_IMAGE_MAX_SIDE, Math.max(1, Math.round(length * scale)))
  return { width: side(width), height: side(height) }
}

/**
 * Reads the file the way the avatar's cropper does -- a FileReader, then an Image -- and
 * resolves with the decoded picture. Rejects where the browser cannot decode it: a desktop
 * browser and an iPhone's HEIC, or a file that is no picture.
 *
 * The browser turns a photo the way its EXIF says (`image-orientation: from-image`, the default
 * in current browsers), so `naturalWidth` and `naturalHeight` are the photo as it is seen, and the
 * drawing below keeps that way up.
 */
export const readChatImageFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('read'))
    reader.onload = () => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('decode'))
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })

/**
 * Draws the picture onto a canvas of the size given, in one step from the decoded source -- not
 * through a smaller copy, which would blur it twice. White under it: a PNG's transparent parts
 * would otherwise come out black in the JPEG (as the avatar's applyCrop says).
 */
export const drawChatImage = (image, width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)
  return canvas
}

/**
 * A picture the member chose, made ready for a chat message: fitted into the area of 800 x 600
 * and encoded as JPEG under 32 KB -- the quality lowered step by step first (85 to 45 %, the
 * avatar's steps), and where that is not enough, the size (E-041).
 *
 * Resolves with `{ data, width, height, bytes }`: the JPEG as base64 without a data URI's head,
 * its size in whole pixels (the server's ChatImageInput takes integers only, LOG-071), and its
 * bytes. Rejects with a ChatImageError.
 *
 * `read`, `draw` and `encode` are there for the spec -- jsdom decodes and paints nothing -- and
 * default to the ones above and the avatar's encoder.
 *
 * @param {File} file
 */
export const encodeChatImage = async (
  file,
  { read = readChatImageFile, draw = drawChatImage, encode = encodeUnderTarget } = {},
) => {
  // Before anything is read: a file is read into memory whole, and decoding it costs several
  // times its size again (AVATAR_SOURCE_MAX_BYTES says why 20 MB).
  if (file.size > AVATAR_SOURCE_MAX_BYTES) throw new ChatImageError('SOURCE_TOO_LARGE')

  let image
  try {
    image = await read(file)
  } catch {
    throw new ChatImageError(isHeicFileName(file.name) ? 'HEIC' : 'FORMAT')
  }
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight
  if (!(sourceWidth > 0 && sourceHeight > 0)) throw new ChatImageError('FORMAT')

  let area = CHAT_IMAGE_AREA
  for (let round = 0; round < CHAT_IMAGE_ROUNDS; round += 1) {
    const { width, height } = chatImageSize(sourceWidth, sourceHeight, area)
    const encoded = encode(
      draw(image, width, height),
      CHAT_IMAGE_TARGET_BYTES,
      AVATAR_QUALITY_STEPS,
    )
    if (encoded.bytes <= CHAT_IMAGE_TARGET_BYTES) {
      return { data: encoded.base64, width, height, bytes: encoded.bytes }
    }
    area *= CHAT_IMAGE_SHRINK
  }
  throw new ChatImageError('NOT_SMALL_ENOUGH')
}

// AI-GENERATED — not an architecture reference
import {
  AVATAR_QUALITY_STEPS,
  AVATAR_SOURCE_MAX_BYTES,
  encodeUnderTarget,
  isHeicFileName,
} from '@/utils/avatarImage'
import { CHAT_IMAGE_UNEDITED, chatImageCut, drawChatImageCut } from '@/utils/chatImageEdit'

// A picture in a chat message (P7) is made small here, in the browser, before it goes anywhere
// (E-041, E-046): the server gets a finished JPEG as base64 in one mutation, the way the avatar
// goes (P-011), and never an original.
//
// Two steps since the pictures can be edited (E-047): `openChatImage` decodes the file the member
// chose and keeps it whole -- the editor turns, mirrors and cuts it, and "Sichern" saves it in full
// quality -- and `encodeChatImage` makes the edited picture small only when the message is sent.
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
 * What the server's refusal of a message with a picture was about, for the bar's own words:
 * - IMAGE_NOT_ACCEPTED -- the picture itself was not taken (CHAT_IMAGE_NOT_ACCEPTED: EMPTY,
 *   TOO_LARGE, NOT_JPEG or SIZE; a picture made here should never be, so no reason is named);
 * - TOO_LARGE_ACROSS_BORDER -- the text is too long to go with the picture to another community
 *   (CHAT_MESSAGE_NOT_SENT: TOO_LARGE_ACROSS_BORDER, P7b: the encrypted command would pass what
 *   the other server takes).
 * Null for every other failure, which the bar calls "not sent" as before. Read off the error's
 * message, as ContactWindow reads CHAT_VIDEO_NO_SERVER.
 */
export const chatImageRefusal = (error) => {
  const message = String(error?.message ?? '')
  if (message.includes('CHAT_IMAGE_NOT_ACCEPTED')) return 'IMAGE_NOT_ACCEPTED'
  if (message.includes('TOO_LARGE_ACROSS_BORDER')) return 'TOO_LARGE_ACROSS_BORDER'
  return null
}

/**
 * The size a picture is drawn at, in whole pixels: its own proportions, the area given (the
 * first round's, or a smaller one), never larger than it is, and no side past the server's bound.
 *
 * ⛔ Fitted, never cropped: a chat picture has no frame it must fill. What is cut away, the member
 * cuts in the editor (E-047); this only makes smaller what they kept.
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
 * Decodes the file the member chose and resolves with the picture. Rejects where the browser
 * cannot decode it: a desktop browser and an iPhone's HEIC, or a file that is no picture.
 *
 * Through an object URL, let go as soon as the picture has come: the picture stays in memory while
 * it is edited, and a data URL would keep the whole file a second time, as text.
 *
 * The browser turns a photo the way its EXIF says (`image-orientation: from-image`, the default
 * in current browsers), so `naturalWidth` and `naturalHeight` are the photo as it is seen, and the
 * drawing below keeps that way up.
 */
export const readChatImageFile = (file) =>
  new Promise((resolve, reject) => {
    const address = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(address)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(address)
      reject(new Error('decode'))
    }
    image.src = address
  })

/**
 * The picture the member chose, opened for editing and sending: `{ image, width, height }`, the
 * decoded picture and its size as seen. Rejects with a ChatImageError.
 *
 * `read` is there for the spec -- jsdom decodes nothing -- and defaults to the one above.
 *
 * @param {File} file
 */
export const openChatImage = async (file, { read = readChatImageFile } = {}) => {
  // Before anything is read: decoding a file costs several times its size in memory
  // (AVATAR_SOURCE_MAX_BYTES says why 20 MB).
  if (file.size > AVATAR_SOURCE_MAX_BYTES) throw new ChatImageError('SOURCE_TOO_LARGE')

  let image
  try {
    image = await read(file)
  } catch {
    throw new ChatImageError(isHeicFileName(file.name) ? 'HEIC' : 'FORMAT')
  }
  const width = image.naturalWidth
  const height = image.naturalHeight
  if (!(width > 0 && height > 0)) throw new ChatImageError('FORMAT')
  return { image, width, height }
}

/**
 * Draws the edited picture onto a canvas of the size given, in one step from the decoded source
 * -- not through a smaller copy, which would blur it twice. White under it: a PNG's transparent
 * parts would otherwise come out black in the JPEG (as the avatar's applyCrop says).
 *
 * @param {{ image: CanvasImageSource, width: number, height: number }} source
 * @param {typeof CHAT_IMAGE_UNEDITED} edit
 */
export const drawChatImage = (source, edit, width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  drawChatImageCut(context, source.image, source.width, source.height, edit, {
    x: 0,
    y: 0,
    width,
    height,
  })
  return canvas
}

/**
 * The edited picture made ready for a chat message, when it is sent (E-047, point 6): fitted into
 * the area of 800 x 600 and encoded as JPEG under 32 KB -- the quality lowered step by step first
 * (85 to 45 %, the avatar's steps), and where that is not enough, the size (E-041).
 *
 * Resolves with `{ data, width, height, bytes }`: the JPEG as base64 without a data URI's head,
 * its size in whole pixels (the server's ChatImageInput takes integers only, LOG-071), and its
 * bytes. Rejects with a ChatImageError.
 *
 * `draw` and `encode` are there for the spec -- jsdom paints nothing -- and default to the one above
 * and the avatar's encoder.
 *
 * @param {{ image: CanvasImageSource, width: number, height: number }} source from openChatImage
 * @param {typeof CHAT_IMAGE_UNEDITED} edit what the member did in the editor
 */
export const encodeChatImage = async (
  source,
  edit = CHAT_IMAGE_UNEDITED,
  { draw = drawChatImage, encode = encodeUnderTarget } = {},
) => {
  const cut = chatImageCut(source.width, source.height, edit)
  let area = CHAT_IMAGE_AREA
  for (let round = 0; round < CHAT_IMAGE_ROUNDS; round += 1) {
    const { width, height } = chatImageSize(cut.width, cut.height, area)
    const encoded = encode(
      draw(source, edit, width, height),
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

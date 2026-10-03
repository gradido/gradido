// AI-GENERATED — not an architecture reference
import CONFIG from '@/config'
import {
  CHAT_IMAGE_AREA,
  CHAT_IMAGE_TARGET_BYTES,
  chatImageSize,
  drawChatImage,
  encodeChatImage,
} from '@/utils/chatImage'
import { chatImageCut, framedChatImageEdit } from '@/utils/chatImageEdit'
import { THANK_YOU_MOTIF_HEIGHT, THANK_YOU_MOTIF_WIDTH } from '@/utils/thankYouMotifs'

// A photo of the member's own on a thank-you greeting, in the place of a motif (ZE-019, ZE-024).
//
// The card has ONE place for its picture, 36 : 25 as the five motifs are. The member cuts the
// photo to that place in the chat's picture editor, or fits the whole of it in: where the photo
// does not fill the place, a margin in the colour of the card stands, and that margin is part of
// the picture -- so every place that shows it shows it like any other picture.
//
// Two renditions are made of it, here in the browser and with the chat's encoder: the small one
// in the chat's measure goes with the link and stays with the booking; the large one serves the
// page the link opens as, and the server lets it go once the thank-you is accepted or deleted.
// As with a chat picture, the re-encoding is what keeps a phone photo's EXIF data off the server.

/** The place of the picture on the card, width to height: the motifs' own 360 x 250. */
export const THANK_YOU_PICTURE_FRAME = THANK_YOU_MOTIF_WIDTH / THANK_YOU_MOTIF_HEIGHT

/**
 * The colour of that place: what stands there before a picture has come, and so what stands
 * beside a photo that was fitted in whole. Named HERE for everything that draws -- the editor and
 * both renditions; the stylesheets of the places that show a greeting's picture say the same, and
 * thankYouPicture.drift.spec.js holds them to it (`.redeem-thanks-paper-picture` first of all).
 */
export const THANK_YOU_PICTURE_GROUND = '#fbf3de'

/** A photo as chosen, before the member did anything to it: filling the place, cut in the middle. */
export const thankYouPictureEdit = () =>
  framedChatImageEdit(THANK_YOU_PICTURE_FRAME, THANK_YOU_PICTURE_GROUND)

/**
 * The small rendition: the chat's measure, the area of 800 x 600 under 32 KB. The server takes it
 * as it takes a chat picture (acceptChatMessageImage: 35 KB, 500,000 pixels).
 */
export const THANK_YOU_PICTURE_SMALL = Object.freeze({
  area: CHAT_IMAGE_AREA,
  targetBytes: CHAT_IMAGE_TARGET_BYTES,
})

/**
 * The large rendition: up to 1080 x 750 under 68 KB. A phone shows the card's picture 990 pixels
 * wide, a computer 1064 (measured in the built wallet); the server takes up to 72 KB and 850,000
 * pixels (THANK_YOU_PICTURE_LARGE_MAX_BYTES and _MAX_PIXELS in `shared`), and a request up to
 * 100 KB, which 72 KB as base64 come to.
 */
export const THANK_YOU_PICTURE_LARGE = Object.freeze({
  area: 1080 * 750,
  targetBytes: 68 * 1024,
})

/**
 * Both renditions of the edited photo, the small one first. Resolves with `{ small, large }`,
 * each `{ data, width, height, bytes }` as encodeChatImage makes it.
 *
 * Rejects with a ChatImageError where the SMALL one cannot be made: without it there is no
 * greeting with this photo. `large` is null where the large one cannot be made -- the greeting
 * goes without it, and the page its link opens as shows the small one.
 *
 * `encode` is there for the spec and defaults to the chat's encoder.
 *
 * @param {{ image: CanvasImageSource, width: number, height: number }} source from openChatImage
 * @param {ReturnType<typeof thankYouPictureEdit>} edit what the member did in the editor
 */
export const encodeThankYouPictures = async (source, edit, { encode = encodeChatImage } = {}) => {
  const small = await encode(source, edit, THANK_YOU_PICTURE_SMALL)
  let large = null
  try {
    large = await encode(source, edit, THANK_YOU_PICTURE_LARGE)
  } catch {
    large = null
  }
  return { small, large }
}

/** What the server takes of a rendition (ChatImageInput): the JPEG and its size, nothing else. */
export const thankYouPictureInput = ({ data, width, height }) => ({ data, width, height })

/** The quality of the picture the wallet shows the member of their own photo, before it is sent. */
export const THANK_YOU_PICTURE_PREVIEW_QUALITY = 0.9

/**
 * The edited photo for the member's own eyes -- in its tile, on the last look and on "Fertig" --,
 * before anything is sent and without asking the server for it: a JPEG as a data URL, in the
 * card's shape and at most the large rendition's size. Drawn by the same function as the two
 * renditions, so it shows the same cutout and the same margin.
 *
 * ⛔ It lives where the caller keeps it, and that is the memory of a page: never the store, which
 * is mirrored into the device's storage.
 *
 * `draw` is there for the spec -- jsdom paints nothing.
 */
export const thankYouPicturePreview = (source, edit, { draw = drawChatImage } = {}) => {
  const cut = chatImageCut(source.width, source.height, edit)
  const { width, height } = chatImageSize(cut.width, cut.height, THANK_YOU_PICTURE_LARGE.area)
  return draw(source, edit, width, height).toDataURL(
    'image/jpeg',
    THANK_YOU_PICTURE_PREVIEW_QUALITY,
  )
}

/**
 * The address the picture of an OPEN link is served under, for whoever holds its code -- signed
 * in or not (backend/src/server/thankYouGreetingPicture.ts): the large rendition, or the small one
 * where there is no large one, as a plain JPEG. On the server the wallet talks to: behind nginx
 * that is the wallet's own origin, in development another port.
 *
 * ⛔ The code goes into the path as it is; a text that has not the form of a code gets no address.
 *
 * @param {string} code the code of the link, as the page of the link has it in its address
 * @returns {string | null}
 */
export const thankYouPictureAddress = (code) => {
  if (typeof code !== 'string' || !/^[0-9a-f]{24}$/i.test(code)) return null
  const server = new URL(CONFIG.GRAPHQL_URI, window.location.href)
  return new URL(`/api/thank-you-greeting-picture/${code}`, server).href
}

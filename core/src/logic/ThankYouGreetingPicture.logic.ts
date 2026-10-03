// AI-GENERATED — not an architecture reference
import {
  dbDeleteThankYouGreetingPicturesByLinkCode,
  ThankYouGreetingPictureRendition,
} from 'database'
import { getLogger } from 'log4js'
import {
  CHAT_IMAGE_MAX_SIDE,
  DomainError,
  Result,
  THANK_YOU_PICTURE_LARGE_MAX_BYTES,
  THANK_YOU_PICTURE_LARGE_MAX_PIXELS,
} from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { databaseErrorCode } from './ChatMessage.logic'
import { ChatMessageImageAccepted, ChatMessageImageSent } from './ChatMessageImage.logic'
import { decodeJpegImage, JpegImageRefusal } from './JpegImage.logic'

const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.logic.ThankYouGreetingPicture`)

/**
 * The picture of a thank-you greeting that carries a photo of the member's own (ZE-019): what
 * its large rendition has to be to come in, and how its renditions go again.
 *
 * The small rendition is a chat picture in every bound and is checked as one
 * (acceptChatMessageImage) -- it is what the conversation of the two shows once the greeting is
 * accepted. The large one has bounds of its own, below.
 *
 * In `core`, not in the backend: a link is accepted from another community as well
 * (processXComCompleteTransaction), by the federation module, and the large rendition goes on
 * that way too.
 *
 * ⛔ What this writes to the log names a link by its code, never a picture's bytes -- and never a
 * database error's message: a failed Drizzle query carries its parameters in it.
 */

/** Why a picture was refused: the JPEG check's reasons, or SIZE for a width or height out of bounds. */
export type ThankYouGreetingPictureRefusal = JpegImageRefusal | 'SIZE'

export class ThankYouGreetingPictureNotAccepted extends DomainError {
  constructor(
    public readonly reason: ThankYouGreetingPictureRefusal,
    public readonly bytes: number,
    public readonly width: number,
    public readonly height: number,
  ) {
    super(`THANK_YOU_PICTURE_NOT_ACCEPTED: ${reason}, ${bytes} bytes, ${width} x ${height}`)
  }
}

const isSide = (side: number): boolean =>
  Number.isInteger(side) && side >= 1 && side <= CHAT_IMAGE_MAX_SIDE

/**
 * Whether a large rendition of this size may come in: each side a whole number from 1 to
 * CHAT_IMAGE_MAX_SIDE, and the area at most THANK_YOU_PICTURE_LARGE_MAX_PIXELS -- the wallet
 * draws it at 1080 x 750 at most.
 *
 * The size is the sender's word, as a chat picture's: without a decoder the server cannot
 * measure it, only bound it.
 */
export const largeThankYouGreetingPictureSizeFits = (width: number, height: number): boolean =>
  isSide(width) && isSide(height) && width * height <= THANK_YOU_PICTURE_LARGE_MAX_PIXELS

/**
 * The large rendition as a member sends it, checked the way a chat picture and the avatar are
 * (decodeJpegImage): not empty, at most THANK_YOU_PICTURE_LARGE_MAX_BYTES, a JPEG at both ends
 * -- and a size that fits. Nothing is decoded and nothing changed: the wallet has cut, scaled
 * and encoded it.
 */
export function acceptLargeThankYouGreetingPicture({
  data,
  width,
  height,
}: ChatMessageImageSent): Result<ChatMessageImageAccepted, ThankYouGreetingPictureNotAccepted> {
  const decoded = decodeJpegImage(data, THANK_YOU_PICTURE_LARGE_MAX_BYTES)
  if (!decoded.success) {
    return {
      success: false,
      error: new ThankYouGreetingPictureNotAccepted(
        decoded.error.reason,
        decoded.error.bytes,
        width,
        height,
      ),
    }
  }
  if (!largeThankYouGreetingPictureSizeFits(width, height)) {
    return {
      success: false,
      error: new ThankYouGreetingPictureNotAccepted('SIZE', decoded.value.length, width, height),
    }
  }
  return { success: true, value: { image: decoded.value, width, height } }
}

/**
 * Takes the pictures of a link's greeting out -- both renditions, or the one named -- and says
 * whether the database did as asked. A link without a picture is no failure: most links have
 * none.
 *
 * ⛔ Never throws. It runs where a link could not be saved, where one was deleted and after one
 * was accepted, and none of the three may fail over it: its own failure is only logged. A row
 * left behind is handed to nobody -- every reader starts from the link and asks the rule first
 * (backend: data/ThankYouGreetingPicture.logic.ts).
 */
export async function removeThankYouGreetingPictures(
  transactionLinkCode: string,
  rendition?: ThankYouGreetingPictureRendition,
): Promise<boolean> {
  const logger = createLogger()
  const which = rendition ?? 'all'
  try {
    const removed = await dbDeleteThankYouGreetingPicturesByLinkCode(transactionLinkCode, rendition)
    if (removed > 0) {
      logger.info(
        `thank-you greeting pictures removed: code=${transactionLinkCode} rendition=${which} count=${removed}`,
      )
    }
    return true
  } catch (error) {
    logger.error(
      `thank-you greeting pictures not removed: code=${transactionLinkCode} rendition=${which} (${databaseErrorCode(error)})`,
    )
    return false
  }
}

/**
 * The thank-you is accepted: the large rendition has served the page the link opened as, and
 * goes. The small one stays with the booking. Never throws (removeThankYouGreetingPictures) --
 * it runs AFTER the booking and may neither undo nor hold it.
 */
export const removeLargeThankYouGreetingPicture = (transactionLinkCode: string): Promise<boolean> =>
  removeThankYouGreetingPictures(transactionLinkCode, 'large')

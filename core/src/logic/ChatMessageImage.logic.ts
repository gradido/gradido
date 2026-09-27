// AI-GENERATED — not an architecture reference
import { dbDeleteChatMessageImagesByMessageUuid, dbInsertChatMessageImage } from 'database'
import { getLogger } from 'log4js'
import {
  CHAT_IMAGE_MAX_BYTES,
  CHAT_IMAGE_MAX_PIXELS,
  CHAT_IMAGE_MAX_SIDE,
  DomainError,
  Result,
} from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { databaseErrorCode } from './ChatMessage.logic'
import { decodeJpegImage, JpegImageRefusal } from './JpegImage.logic'

const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.logic.ChatMessageImage`)

/**
 * The pictures in chat messages (P7): what a picture has to be to come in, and how it is filed
 * with its message. The sending server uses it for a message within its community
 * (deliverChatMessageLocally); the receiving server is to use it for a picture from another
 * community (P7b).
 *
 * ⛔ What this writes to the log names messages and pictures by their uuids, never a picture's
 * bytes -- and never a database error's message: a failed Drizzle query carries the parameters
 * of the insert in it, the picture among them.
 */

/** A picture as a member sends it with a chat message: base64, and the size they give. */
export interface ChatMessageImageSent {
  data: string
  width: number
  height: number
}

/** A picture that came in: its bytes, and the size the sender gave. */
export interface ChatMessageImageAccepted {
  image: Buffer
  width: number
  height: number
}

/** A picture as it is filed: named, and in its place in the message. */
export interface ChatMessageImageToStore extends ChatMessageImageAccepted {
  imageUuid: string
  position: number
}

/** Why a picture was refused: the JPEG check's reasons, or SIZE for a width or height out of bounds. */
export type ChatMessageImageRefusal = JpegImageRefusal | 'SIZE'

export class ChatMessageImageNotAccepted extends DomainError {
  constructor(
    public readonly reason: ChatMessageImageRefusal,
    public readonly bytes: number,
    public readonly width: number,
    public readonly height: number,
  ) {
    super(`CHAT_IMAGE_NOT_ACCEPTED: ${reason}, ${bytes} bytes, ${width} x ${height}`)
  }
}

const isSide = (side: number): boolean =>
  Number.isInteger(side) && side >= 1 && side <= CHAT_IMAGE_MAX_SIDE

/**
 * Whether a picture of this size may come in: each side a whole number from 1 to
 * CHAT_IMAGE_MAX_SIDE, and the area at most CHAT_IMAGE_MAX_PIXELS -- what the wallet scales a
 * picture down to, whatever its format.
 *
 * The size is the sender's word: without a decoder the server cannot measure it, only bound it.
 * The sides are bounded where the argument arrives as well (ChatImageInput); here they are for
 * a picture that comes another way (P7b).
 */
export const chatMessageImageSizeFits = (width: number, height: number): boolean =>
  isSide(width) && isSide(height) && width * height <= CHAT_IMAGE_MAX_PIXELS

/**
 * A picture sent with a chat message, checked the way the avatar is checked (decodeJpegImage):
 * not empty, at most CHAT_IMAGE_MAX_BYTES, a JPEG at both ends -- and a size that fits. Nothing
 * is decoded and nothing changed: the wallet has scaled and encoded it (E-041).
 */
export function acceptChatMessageImage({
  data,
  width,
  height,
}: ChatMessageImageSent): Result<ChatMessageImageAccepted, ChatMessageImageNotAccepted> {
  const decoded = decodeJpegImage(data, CHAT_IMAGE_MAX_BYTES)
  if (!decoded.success) {
    return {
      success: false,
      error: new ChatMessageImageNotAccepted(
        decoded.error.reason,
        decoded.error.bytes,
        width,
        height,
      ),
    }
  }
  if (!chatMessageImageSizeFits(width, height)) {
    return {
      success: false,
      error: new ChatMessageImageNotAccepted('SIZE', decoded.value.length, width, height),
    }
  }
  return { success: true, value: { image: decoded.value, width, height } }
}

/**
 * Takes the pictures of a message back out -- where the message they were filed for could not
 * be filed itself. Nobody could have seen them: a picture is handed out only with its message.
 *
 * ⛔ Never throws, like storeChatMessage: it runs where something has failed already, and its
 * own failure is only logged. A picture left behind is seen by nobody.
 */
export async function removeChatMessageImages(messageUuid: string): Promise<void> {
  const logger = createLogger()
  try {
    const removed = await dbDeleteChatMessageImagesByMessageUuid(messageUuid)
    logger.info(`chat message pictures removed: message_uuid=${messageUuid} count=${removed}`)
  } catch (error) {
    logger.error(
      `chat message pictures not removed: message_uuid=${messageUuid} (${databaseErrorCode(error)})`,
    )
  }
}

/**
 * Files the pictures of a message under its uuid -- BEFORE the message itself (see
 * deliverChatMessageLocally) -- and says whether all of them are filed. Where one is not, the
 * ones already filed are taken back out: a message goes with all its pictures or not at all.
 *
 * For a message uuid that has just been made: taking pictures back out removes every picture
 * filed under the uuid.
 *
 * ⛔ Never throws, like storeChatMessage. Whatever the database throws is caught here and
 * logged, and the answer is false: the caller files no message then, and mails none.
 */
export async function storeChatMessageImages(
  messageUuid: string,
  images: ChatMessageImageToStore[],
): Promise<boolean> {
  const logger = createLogger()
  try {
    for (const picture of images) {
      const filed = await dbInsertChatMessageImage({
        imageUuid: picture.imageUuid,
        messageUuid,
        position: picture.position,
        width: picture.width,
        height: picture.height,
        image: picture.image,
        mimeType: 'image/jpeg',
      })
      if (!filed.success) {
        logger.error(
          `chat message picture not stored: message_uuid=${messageUuid} image_uuid=${picture.imageUuid} (${filed.error.name})`,
        )
        await removeChatMessageImages(messageUuid)
        return false
      }
    }
  } catch (error) {
    logger.error(
      `chat message picture not stored: message_uuid=${messageUuid} (${databaseErrorCode(error)})`,
    )
    await removeChatMessageImages(messageUuid)
    return false
  }
  logger.info(`chat message pictures stored: message_uuid=${messageUuid} count=${images.length}`)
  return true
}

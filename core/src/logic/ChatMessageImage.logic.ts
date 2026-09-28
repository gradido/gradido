// AI-GENERATED — not an architecture reference
import {
  DBDuplicateEntryError,
  dbDeleteChatMessageImagesByMessageUuid,
  dbInsertChatMessageImage,
  dbSelectChatMessageImageInfos,
} from 'database'
import { getLogger } from 'log4js'
import {
  CHAT_IMAGE_MAX_BYTES,
  CHAT_IMAGE_MAX_PIXELS,
  CHAT_IMAGE_MAX_SIDE,
  DomainError,
  Result,
  uuidv4Schema,
} from 'shared'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'
import { databaseErrorCode } from './ChatMessage.logic'
import { decodeJpegImage, JpegImageRefusal } from './JpegImage.logic'

const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.logic.ChatMessageImage`)

/**
 * The pictures in chat messages (P7): what a picture has to be to come in, and how it is filed
 * with its message. The sending server uses it for a message within its community
 * (deliverChatMessageLocally) and for its own copy of one to another community
 * (deliverChatMessageAcrossBorder); the receiving server for a picture from another community
 * (SendEmailCommand, P7b) -- one check for both sides.
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

/**
 * Why the pictures a chat message brought from another community are refused (P7b): what
 * acceptChatMessageImage refuses a picture for, or what is wrong with the list itself -- more
 * than one picture (TOO_MANY), a picture without a uuid to be filed under (NO_UUID), something
 * that is no picture as a command carries one (MALFORMED).
 */
export type IncomingChatMessageImageRefusal =
  | ChatMessageImageRefusal
  | 'MALFORMED'
  | 'TOO_MANY'
  | 'NO_UUID'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * The pictures a chat message brought from another community (SendEmailCommandParams.images,
 * P7b), checked as the sending server checked them (acceptChatMessageImage), each with the name
 * the sending server gave it and filed its own copy under -- or why they are refused. Nothing,
 * null or an empty list: no picture, as from a server from before P7b.
 *
 * One picture at most, as a message carries one. The sending server checks the same before it
 * sends: a picture refused here is a bug or a forgery.
 */
export function acceptIncomingChatMessageImages(
  images: unknown,
): Result<ChatMessageImageToStore[], IncomingChatMessageImageRefusal> {
  if (images === undefined || images === null) {
    return { success: true, value: [] }
  }
  if (!Array.isArray(images)) {
    return { success: false, error: 'MALFORMED' }
  }
  if (images.length > 1) {
    return { success: false, error: 'TOO_MANY' }
  }
  const accepted: ChatMessageImageToStore[] = []
  for (const [position, picture] of images.entries()) {
    if (
      !isRecord(picture) ||
      typeof picture.data !== 'string' ||
      typeof picture.width !== 'number' ||
      typeof picture.height !== 'number'
    ) {
      return { success: false, error: 'MALFORMED' }
    }
    const imageUuid = uuidv4Schema.safeParse(picture.imageUuid)
    if (!imageUuid.success) {
      return { success: false, error: 'NO_UUID' }
    }
    const checked = acceptChatMessageImage({
      data: picture.data,
      width: picture.width,
      height: picture.height,
    })
    if (!checked.success) {
      return { success: false, error: checked.error.reason }
    }
    accepted.push({ ...checked.value, imageUuid: imageUuid.data, position })
  }
  return { success: true, value: accepted }
}

/** What became of a picture from another community: filed now, or by an earlier delivery. */
export type IncomingChatMessageImageFiled = 'FILED' | 'FILED_BEFORE'

/**
 * Files the picture of a chat message from another community under the message's uuid (P7b) --
 * BEFORE the message, as the sending server filed its copy -- and says what became of it.
 *
 * ⛔ A command may come twice, and the second time its picture is there already: the same name in
 * the same place is FILED_BEFORE, not an error. Another picture in its place, or its name under
 * another message, is a CONTRADICTION -- and nothing is taken out: what is there came with
 * another delivery. NOT_STORED where the database refused otherwise.
 *
 * Never throws, like storeChatMessageImages; the log names the message and the picture by their
 * uuids, never the picture.
 */
export async function storeIncomingChatMessageImage(
  messageUuid: string,
  picture: ChatMessageImageToStore,
): Promise<Result<IncomingChatMessageImageFiled, 'CONTRADICTION' | 'NOT_STORED'>> {
  const logger = createLogger()
  const names = `message_uuid=${messageUuid} image_uuid=${picture.imageUuid}`
  try {
    const filed = await dbInsertChatMessageImage({
      imageUuid: picture.imageUuid,
      messageUuid,
      position: picture.position,
      width: picture.width,
      height: picture.height,
      image: picture.image,
      mimeType: 'image/jpeg',
    })
    if (filed.success) {
      logger.info(`chat message picture stored: ${names}`)
      return { success: true, value: 'FILED' }
    }
    if (filed.error instanceof DBDuplicateEntryError) {
      const there = (await dbSelectChatMessageImageInfos([messageUuid])).find(
        (info) => info.position === picture.position,
      )
      if (there?.imageUuid.toLowerCase() === picture.imageUuid.toLowerCase()) {
        logger.info(`chat message picture stored before: ${names}`)
        return { success: true, value: 'FILED_BEFORE' }
      }
      logger.warn(`chat message picture refused, another is stored in its place: ${names}`)
      return { success: false, error: 'CONTRADICTION' }
    }
    logger.error(`chat message picture not stored: ${names} (${filed.error.name})`)
  } catch (error) {
    logger.error(`chat message picture not stored: ${names} (${databaseErrorCode(error)})`)
  }
  return { success: false, error: 'NOT_STORED' }
}

/**
 * The pictures of a chat message as a log may write them (P7b): name and size, and of the bytes
 * only how many characters of base64 they came as -- some 48,000 for a picture, one member's for
 * another. Anything that is no picture list is handed back as it is.
 */
export const chatMessageImagesForLog = (images: unknown): unknown =>
  Array.isArray(images)
    ? images.map((picture) =>
        isRecord(picture) && typeof picture.data === 'string'
          ? { ...picture, data: `*** ${picture.data.length} characters` }
          : picture,
      )
    : images

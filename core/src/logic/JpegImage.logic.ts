// AI-GENERATED — not an architecture reference
import { DomainError, JPEG_END_BYTES, JPEG_MAGIC_BYTES, Result } from 'shared'
import { type ReencodeImageErrorName, reencodeImage } from 'shared-native'

/**
 * What a picture has to be to come into this server: the check every JPEG goes through that
 * a member sends -- their avatar (UserResolver.setUserAvatar) and a picture in a chat message
 * (P7).
 *
 * ★ One module for both, on purpose (E-041). The avatar and the chat picture are stored in the
 * same form -- JPEG bytes in a mediumblob --, and Gradido 2 is to move both to another storage
 * in one go. This is the seam that move takes both along at: one place that says what a
 * picture must be, instead of one copy per kind of picture.
 *
 * The browser does the real work: it scales the picture down and encodes it as a JPEG under its
 * target (Papierschicht P-011, P-014). What arrives here is checked, never decoded or changed --
 * a decoder is what this design keeps out of the backend.
 */

/** Why a picture was refused: nothing arrived, too much arrived, or it is no JPEG. */
export type JpegImageRefusal = 'EMPTY' | 'TOO_LARGE' | 'NOT_JPEG'

export class JpegImageNotAccepted extends DomainError {
  constructor(
    public readonly reason: JpegImageRefusal,
    public readonly bytes: number,
    public readonly maxBytes: number,
  ) {
    super(`JPEG_IMAGE_NOT_ACCEPTED: ${reason}, ${bytes} bytes of at most ${maxBytes}`)
  }
}

const refused = (
  reason: JpegImageRefusal,
  bytes: number,
  maxBytes: number,
): Result<Buffer, JpegImageNotAccepted> => ({
  success: false,
  error: new JpegImageNotAccepted(reason, bytes, maxBytes),
})

/**
 * The bytes of a picture sent as base64 (without a data URI prefix), or why they are not taken:
 * empty, larger than `maxBytes`, or not a JPEG. A refusal is an expected result -- a member's
 * browser may send anything -- and each caller says it in its own words.
 */
export function decodeJpegImage(
  base64: string,
  maxBytes: number,
): Result<Buffer, JpegImageNotAccepted> {
  const bytes = Buffer.from(base64, 'base64')

  if (bytes.length === 0) {
    return refused('EMPTY', 0, maxBytes)
  }
  if (bytes.length > maxBytes) {
    return refused('TOO_LARGE', bytes.length, maxBytes)
  }
  // Buffer.from ignores anything it cannot decode instead of failing, so "it decoded" says
  // nothing about what arrived. The markers do.
  //
  // Both ends, not just the start: on the opening marker alone a three-byte payload of
  // ff d8 00 passes, so the column would take arbitrary data from anyone willing to prefix it.
  // This is still not format validation -- only a decoder could say whether what lies between
  // is a picture.
  const startsRight = bytes[0] === JPEG_MAGIC_BYTES[0] && bytes[1] === JPEG_MAGIC_BYTES[1]
  const endsRight =
    bytes[bytes.length - 2] === JPEG_END_BYTES[0] && bytes[bytes.length - 1] === JPEG_END_BYTES[1]
  if (!startsRight || !endsRight) {
    return refused('NOT_JPEG', bytes.length, maxBytes)
  }

  return { success: true, value: bytes }
}

/**
 * A picture that is shown to more than the two it is between is not stored as it came: it is
 * decoded under hard limits and its pixels are encoded again (rust-image-ffi in shared-native).
 * What is stored then was written by this server from pixels alone -- no EXIF, no comment, no
 * bytes behind the end marker --, and a picture that does not decode is refused.
 *
 * So far for the pictures of a thank-you greeting, which whoever holds a link's code gets. The
 * avatar and the chat picture are still stored as they come (decodeJpegImage alone).
 */

/** The bounds a re-encoded picture is held to: bytes as stored, each side, and the area. */
export interface JpegImageBounds {
  maxBytes: number
  maxSide: number
  maxPixels: number
}

/** A picture as this server encoded it, and the size it really has. */
export interface JpegImageReencoded {
  image: Buffer
  width: number
  height: number
}

/**
 * Why a picture was not re-encoded: it does not decode as a JPEG, it is wider, higher or larger
 * than the bounds, or it does not fit `maxBytes` at the lowest quality.
 */
export type JpegImageReencodeRefusal = 'NOT_JPEG' | 'SIZE' | 'TOO_LARGE'

export class JpegImageNotReencoded extends DomainError {
  constructor(
    public readonly reason: JpegImageReencodeRefusal,
    public readonly nativeError: ReencodeImageErrorName,
    public readonly bytes: number,
  ) {
    super(`JPEG_IMAGE_NOT_REENCODED: ${reason} (${nativeError}), ${bytes} bytes`)
  }
}

/**
 * The qualities a picture is encoded at, the first that fits `maxBytes` wins: the steps the
 * wallet takes to bring a picture under its target (AVATAR_QUALITY_STEPS). Each is the highest
 * quality used, not the one that always is: a JPEG is never encoded at a higher quality than it
 * came in with (jpegQualityFromInput in shared-native), so the wallet's picture, which has been
 * through one of the steps already, comes out at that step and at the size it came in with.
 */
export const JPEG_REENCODE_QUALITY_STEPS = [85, 75, 65, 55, 45]

const reencodeRefusal = (nativeError: ReencodeImageErrorName): JpegImageReencodeRefusal => {
  switch (nativeError) {
    case 'RIMG_ERR_LIMIT':
      return 'SIZE'
    case 'RIMG_ERR_BUFFER_TOO_SMALL':
      return 'TOO_LARGE'
    default:
      return 'NOT_JPEG'
  }
}

/**
 * The picture decoded and encoded again as a JPEG within `bounds`, with the size the decoder
 * found -- or why not. JPEG in only: the format is decided on the first bytes. Every pass is
 * CPU work on a worker thread, and a picture from the wallet takes one.
 */
export async function reencodeJpegImage(
  image: Buffer,
  { maxBytes, maxSide, maxPixels }: JpegImageBounds,
): Promise<Result<JpegImageReencoded, JpegImageNotReencoded>> {
  let nativeError: ReencodeImageErrorName = 'RIMG_ERR_BUFFER_TOO_SMALL'
  // The quality the last pass encoded at; a step that is not below it would encode the same again.
  let encodedAt = Number.POSITIVE_INFINITY
  for (const jpegQuality of JPEG_REENCODE_QUALITY_STEPS) {
    if (jpegQuality >= encodedAt) {
      continue
    }
    const reencoded = await reencodeImage(image, {
      maxOutputBytes: maxBytes,
      maxWidth: maxSide,
      maxHeight: maxSide,
      maxPixels,
      jpegQuality,
    })
    if (reencoded.success) {
      const { data, width, height } = reencoded.value
      return { success: true, value: { image: data, width, height } }
    }
    nativeError = reencoded.error.name
    // Only a picture over the byte bound gets better at a lower quality.
    if (nativeError !== 'RIMG_ERR_BUFFER_TOO_SMALL') {
      break
    }
    // 0 is a quality nobody could read from the picture; the step was used as it is then.
    encodedAt = Math.min(jpegQuality, reencoded.error.inputJpegQuality || jpegQuality)
  }
  return {
    success: false,
    error: new JpegImageNotReencoded(reencodeRefusal(nativeError), nativeError, image.length),
  }
}

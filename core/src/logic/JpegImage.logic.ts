// AI-GENERATED — not an architecture reference
import { DomainError, JPEG_END_BYTES, JPEG_MAGIC_BYTES, Result } from 'shared'

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

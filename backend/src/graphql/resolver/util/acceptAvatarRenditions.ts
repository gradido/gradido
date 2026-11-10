// AI-GENERATED — not an architecture reference
import { decodeJpegImage, reencodeJpegImage } from 'core'
import {
  AVATAR_FULL_MAX_BYTES,
  AVATAR_FULL_MAX_SIDE,
  AVATAR_SMALL_MAX_BYTES,
  AVATAR_SMALL_MAX_SIDE,
} from 'shared'
import { LogError } from '@/server/LogError'

/**
 * The two renditions of a profile picture as they are stored: the member's own picture
 * (setUserAvatar), and the member's own picture of a contact (setKeptPicture, AS-024). Both
 * arguments are base64 without a data URI prefix, from one crop in the browser.
 *
 * One after the other, the cheap one first: where the small one is refused, no work is done on
 * the full one.
 */
export const acceptAvatarRenditions = async (
  avatarSmall: string,
  avatarFull: string,
): Promise<{ small: Buffer; full: Buffer }> => {
  const small = await acceptAvatar(
    avatarSmall,
    'small',
    AVATAR_SMALL_MAX_BYTES,
    AVATAR_SMALL_MAX_SIDE,
  )
  const full = await acceptAvatar(avatarFull, 'full', AVATAR_FULL_MAX_BYTES, AVATAR_FULL_MAX_SIDE)
  return { small, full }
}

/**
 * One rendition as it is stored: checked, then decoded and encoded again within `maxBytes`
 * and `maxSide` on each side. Named in the error so a member over budget learns WHICH
 * picture was refused — with two of them in one request, "too large" on its own sends
 * whoever reads it looking in the wrong place.
 *
 * The checks are decodeJpegImage and reencodeJpegImage in `core`, the ones the picture of a
 * thank-you greeting goes through as well: one picture module, the seam at which Gradido 2
 * is to move every kind of picture at once (E-041). The words stay the avatar's own.
 */
const acceptAvatar = async (
  image: string,
  which: string,
  maxBytes: number,
  maxSide: number,
): Promise<Buffer> => {
  const decoded = decodeJpegImage(image, maxBytes)
  if (!decoded.success) {
    const { reason, bytes } = decoded.error
    if (reason === 'EMPTY') {
      throw new LogError(`Avatar image (${which}) is empty`)
    }
    if (reason === 'TOO_LARGE') {
      throw new LogError(`Avatar image (${which}) too large`, { bytes, max: maxBytes })
    }
    throw new LogError(`Avatar image (${which}) is not a JPEG`)
  }
  const reencoded = await reencodeJpegImage(decoded.value, {
    maxBytes,
    maxSide,
    maxPixels: maxSide * maxSide,
  })
  if (!reencoded.success) {
    const { reason, bytes } = reencoded.error
    if (reason === 'SIZE') {
      throw new LogError(`Avatar image (${which}) has too many pixels`, { maxSide })
    }
    if (reason === 'TOO_LARGE') {
      throw new LogError(`Avatar image (${which}) too large`, { bytes, max: maxBytes })
    }
    throw new LogError(`Avatar image (${which}) is not a JPEG`)
  }
  return reencoded.value.image
}

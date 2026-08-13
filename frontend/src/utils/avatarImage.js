// AI-GENERATED — not an architecture reference

// One upload, two squares.
//
// The full one is not taken from any screen: an avatar printed 25 mm wide at 300 dpi
// needs about 295 pixels, and the printed member card is what sets the floor. It is
// shown to nobody but its owner.
export const AVATAR_FULL_SIZE = 512

// The small one IS taken from a screen, from the largest place it appears: the navbar
// avatar at 61 CSS pixels, which wants 122 real ones on a 2x display. Everything else
// that shows a picture -- lists, chat, transactions -- is smaller than that. This is the
// rendition other people see.
export const AVATAR_SMALL_SIZE = 128

// Both below their backstops in `shared`, leaving room for base64 growth and the query
// around them. The two travel in one mutation, so they share express' 100 KB request
// limit; see AVATAR_FULL_MAX_BYTES there for the arithmetic.
export const AVATAR_FULL_TARGET_BYTES = 55 * 1024
export const AVATAR_SMALL_TARGET_BYTES = 8 * 1024

export const AVATAR_QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45]

/**
 * How many bytes a data URI carries, without the `data:image/jpeg;base64,` head.
 * Base64 spends four characters on every three bytes, so the payload length times 0.75
 * is the byte count (padding makes this off by at most two, which does not matter for a
 * size budget).
 */
export function base64ByteLength(dataUrl) {
  const start = dataUrl.indexOf(',') + 1
  return Math.round((dataUrl.length - start) * 0.75)
}

/**
 * Encodes the canvas as JPEG, lowering quality step by step until the result fits under
 * `targetBytes`. The member never picks a quality — they pick a picture, and the size is
 * guaranteed no matter how detailed their photo is.
 *
 * That guarantee is the point: the server accepts 100 KB of request body, and base64
 * grows bytes by about 37%, so an unbounded picture would simply be rejected. A
 * fixed quality does not bound anything — a detailed portrait at 0.85 can be several
 * times the size of a plain one.
 *
 * Returns the last step when even the lowest quality is still too large. Better a
 * picture slightly over budget than none, and the backend has its own limit.
 */
export function encodeUnderTarget(
  canvas,
  targetBytes = AVATAR_FULL_TARGET_BYTES,
  steps = AVATAR_QUALITY_STEPS,
) {
  let index = 0
  let dataUrl = canvas.toDataURL('image/jpeg', steps[index])
  let bytes = base64ByteLength(dataUrl)

  while (bytes > targetBytes && index < steps.length - 1) {
    index += 1
    dataUrl = canvas.toDataURL('image/jpeg', steps[index])
    bytes = base64ByteLength(dataUrl)
  }

  return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), bytes, quality: steps[index] }
}

/**
 * Whether the browser refusing this file is the HEIC case, which is the one worth naming
 * to the member: iPhones store photos in HEIC, iOS converts on pick, and a desktop
 * browser cannot decode it at all. Without the distinction, choosing such a file simply
 * does nothing and nobody can tell why.
 */
export function isHeicFileName(fileName) {
  return /\.(heic|heif)$/i.test(fileName ?? '')
}

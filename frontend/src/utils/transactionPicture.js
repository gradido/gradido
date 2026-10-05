// AI-GENERATED — not an architecture reference
import { thankYouMotif } from '@/utils/thankYouMotifs'

// The picture a member sent with a transfer (ZE-016), as the booking list names it with the
// booking: `{ motif, hasPicture }` -- one of the motifs of the thank-you greeting by its key, or
// that it is a photo of the sender's own.

/**
 * What of such a picture a place shows, or null where it shows none:
 * - `{ photo: true }` -- a photo of the sender's own; the place asks for it by the id of the
 *   booking once it is in sight (ThankYouGreetingPhoto with `transaction-id`);
 * - `{ motif: { key, src, name } }` -- one of the motifs this wallet knows.
 *
 * Null for a booking without a picture, and for a motif this wallet does not know (a server
 * newer than the wallet may name a sixth): the booking is shown without a picture then.
 *
 * @param {{ motif: string | null, hasPicture: boolean } | null | undefined} picture
 * @param {(key: string) => string} t the page's translate function
 */
export const transactionPictureShown = (picture, t) => {
  if (!picture) return null
  if (picture.hasPicture === true) return { photo: true }
  const motif = thankYouMotif(picture.motif, t)
  return motif ? { motif } : null
}

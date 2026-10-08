// AI-GENERATED — not an architecture reference
import { isThankYouMotif, ThankYouMotif } from 'shared'
import * as v from 'valibot'

/**
 * The picture a member may add to a transfer (sendCoins): one of the motifs of the thank-you
 * greeting by its key, OR a photo of their own, or neither -- never both.
 *
 * In the form of thankYouGreetingSchema, which checks the same two for a greeting. Here only
 * that a photo is there and has the shape of one: what a photo has to be is checked where a
 * chat picture's is (acceptedPicture), with the bytes at hand.
 *
 * ⛔ No message here quotes what was sent: a message ends up in the error log. valibot's own
 * messages do quote, so every schema below is given one of its own, the type checks included.
 */
const NO_PHOTO = 'Transfer picture: not a photo'

export const transactionPictureSchema = v.pipe(
  v.object({
    motif: v.nullish(
      v.pipe(
        v.string('Transfer picture: unknown motif'),
        v.custom<ThankYouMotif>(
          (value) => isThankYouMotif(value as string),
          'Transfer picture: unknown motif',
        ),
      ),
    ),
    picture: v.nullish(
      v.object(
        { data: v.string(NO_PHOTO), width: v.number(NO_PHOTO), height: v.number(NO_PHOTO) },
        NO_PHOTO,
      ),
    ),
  }),
  v.check(
    ({ motif, picture }) => motif == null || picture == null,
    'Transfer picture: a motif or a photo, not both',
  ),
)

export type TransactionPictureInput = v.InferInput<typeof transactionPictureSchema>

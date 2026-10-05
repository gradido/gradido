// AI-GENERATED — not an architecture reference
import { z } from 'zod'
import { isThankYouMotif } from './ThankYouGreeting.logic'

// TODO: replace with valibot schema after update to typescript 5 is possible

/**
 * The picture a member may add to a transfer (sendCoins): one of the motifs of the thank-you
 * greeting by its key, OR a photo of their own, or neither -- never both.
 *
 * In the form of thankYouGreetingSchema, which checks the same two for a greeting. Here only
 * that a photo is there and has the shape of one: what a photo has to be is checked where a
 * chat picture's is (acceptedPicture), with the bytes at hand.
 *
 * ⛔ No message here quotes what was sent: a message ends up in the error log.
 */
export const transactionPictureSchema = z
  .object({
    motif: z.string().refine(isThankYouMotif, 'Transfer picture: unknown motif').nullish(),
    picture: z.object({ data: z.string(), width: z.number(), height: z.number() }).nullish(),
  })
  .refine(
    ({ motif, picture }) => motif == null || picture == null,
    'Transfer picture: a motif or a photo, not both',
  )

export type TransactionPictureInput = z.input<typeof transactionPictureSchema>

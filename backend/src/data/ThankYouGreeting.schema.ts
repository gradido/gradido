// AI-GENERATED — not an architecture reference
import { blankAsNull } from 'shared'
import { z } from 'zod'
import {
  isOneLine,
  isThankYouMotif,
  memoBeginsWithLine,
  THANK_YOU_LINE_MAX_CHARS,
  THANK_YOU_RECIPIENT_NAME_MAX_CHARS,
} from './ThankYouGreeting.logic'

// TODO: replace with valibot schema after update to typescript 5 is possible

// ⛔ No message here quotes what was sent: a message ends up in the error log, and the name a
// member wrote about somebody else must not.

// Trimmed first, so that what is checked is what is stored -- and what the memo is held
// against below.
const oneLineUpTo = (max: number, tooLong: string, notOneLine: string) =>
  z.string().trim().max(max, tooLong).refine(isOneLine, notOneLine)

/**
 * What a thank-you greeting adds to its link. `line` and `recipientName` are optional, and a
 * blank one -- empty or only whitespace -- counts as not given.
 */
export const thankYouGreetingSchema = z.object({
  motif: z.string().refine(isThankYouMotif, 'Thank-you greeting: unknown motif'),
  line: blankAsNull(
    oneLineUpTo(
      THANK_YOU_LINE_MAX_CHARS,
      'Thank-you greeting: the line is too long',
      'Thank-you greeting: the line has to be one line',
    ),
  ),
  recipientName: blankAsNull(
    oneLineUpTo(
      THANK_YOU_RECIPIENT_NAME_MAX_CHARS,
      'Thank-you greeting: the name is too long',
      'Thank-you greeting: the name has to be one line',
    ),
  ),
})

export type ThankYouGreetingInput = z.input<typeof thankYouGreetingSchema>
export type ThankYouGreeting = z.infer<typeof thankYouGreetingSchema>

/**
 * A greeting together with the memo of the link it belongs to: where the greeting has a line,
 * the memo begins with it (memoBeginsWithLine says why). The memo's own bounds are checked
 * where they always were, on TransactionLinkArgs.
 */
export const transactionLinkGreetingSchema = z
  .object({ memo: z.string(), greeting: thankYouGreetingSchema })
  .refine(
    ({ memo, greeting }) => !greeting.line || memoBeginsWithLine(memo, greeting.line),
    'Thank-you greeting: the memo has to begin with the line',
  )

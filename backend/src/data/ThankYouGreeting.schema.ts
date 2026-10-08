// AI-GENERATED — not an architecture reference
import {
  blankAsNull,
  isOneLine,
  isThankYouMotif,
  memoBeginsWithLine,
  THANK_YOU_LINE_MAX_CHARS,
  THANK_YOU_RECIPIENT_NAME_MAX_CHARS,
  ThankYouMotif,
} from 'shared'
import * as v from 'valibot'

// ⛔ No message here quotes what was sent: a message ends up in the error log, and the name a
// member wrote about somebody else must not. valibot's own messages do quote ("... but received
// "Sarah""), so every schema below is given one of its own, the type checks included.
const NO_PICTURE = 'Thank-you greeting: not a picture'

// Trimmed first, so that what is checked is what is stored -- and what the memo is held
// against below.
const oneLineUpTo = (max: number, tooLong: string, notOneLine: string) =>
  v.pipe(v.string(notOneLine), v.trim(), v.maxLength(max, tooLong), v.check(isOneLine, notOneLine))

/**
 * What a thank-you greeting adds to its link. `line` and `recipientName` are optional, and a
 * blank one -- empty or only whitespace -- counts as not given.
 *
 * A greeting carries a motif OR a picture of the member's own -- the small rendition of their
 * photo --, never both and never neither. Here only that it is there and has the shape of one:
 * what a picture has to be is checked where a chat picture's is (acceptChatMessageImage), with
 * the bytes at hand.
 */
export const thankYouGreetingSchema = v.pipe(
  v.object({
    motif: v.nullish(
      v.pipe(
        v.string('Thank-you greeting: unknown motif'),
        v.custom<ThankYouMotif>(
          (value) => isThankYouMotif(value as string),
          'Thank-you greeting: unknown motif',
        ),
      ),
    ),
    picture: v.nullish(
      v.object(
        { data: v.string(NO_PICTURE), width: v.number(NO_PICTURE), height: v.number(NO_PICTURE) },
        NO_PICTURE,
      ),
    ),
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
  }),
  v.check(
    ({ motif, picture }) => (motif != null) !== (picture != null),
    'Thank-you greeting: a motif or a picture, one of the two',
  ),
)

export type ThankYouGreetingInput = v.InferInput<typeof thankYouGreetingSchema>
export type ThankYouGreeting = v.InferOutput<typeof thankYouGreetingSchema>

/**
 * A greeting together with the memo of the link it belongs to: where the greeting has a line,
 * the memo begins with it (memoBeginsWithLine says why). The memo's own bounds are checked
 * where they always were, on TransactionLinkArgs.
 */
export const transactionLinkGreetingSchema = v.pipe(
  v.object({
    memo: v.string('Thank-you greeting: the memo is no text'),
    greeting: thankYouGreetingSchema,
  }),
  v.check(
    ({ memo, greeting }) => !greeting.line || memoBeginsWithLine(memo, greeting.line),
    'Thank-you greeting: the memo has to begin with the line',
  ),
)

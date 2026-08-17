// AI-GENERATED — not an architecture reference
import { randomBytes } from 'node:crypto'

/**
 * Plain rules around the printed card: what a code looks like, what a PIN may be, and
 * what "spent today" means. No orchestration, no database — the resolver does that.
 */

/** Printed on the card and spoken on the phone, so it is worth recognising at a glance. */
export const THANK_YOU_CARD_CODE_PREFIX = 'DK-'
const CODE_RANDOM_BYTES = 16

export const THANK_YOU_CARD_PIN_LENGTH = 6
export const THANK_YOU_CARD_LABEL_MAX_CHARS = 64

/** As wide as the columns they land in — `memo` is varchar(512), `code` varchar(40). */
export const THANK_YOU_CARD_MEMO_MAX_CHARS = 512
export const THANK_YOU_CARD_CODE_MAX_CHARS = 40

/** How long a request waits for its PIN before it stops working. */
export const THANK_YOU_CARD_PAYMENT_VALID_MINUTES = 15

/**
 * A fresh card code: the prefix plus 16 fully random bytes as hex.
 *
 * ⚠️ Deliberately unlike `transactionLinkCode`, which spends part of its 24 characters on
 * the creation time and is therefore left with 52 bits of randomness and a readable
 * creation date. A link lives days and is thrown away; a card lives years in a wallet,
 * and inside a QR code length costs nothing — so there is no reason to trade either
 * randomness or privacy for shortness here.
 */
export const createThankYouCardCode = (): string =>
  THANK_YOU_CARD_CODE_PREFIX + randomBytes(CODE_RANDOM_BYTES).toString('hex')

/** Its own salt, so that a leak cannot make the PIN say anything about the password. */
export const createThankYouCardPinSalt = (): string => randomBytes(16).toString('hex')

/**
 * Six digits, and not one of the handful everybody picks first.
 *
 * ⚠️ Six rather than four is not about the arithmetic — with a three-attempt block the
 * difference between 10 000 and 1 000 000 barely shows. It is insurance against a fault
 * in the counter: at four digits the counter is the ONLY thing between a guesser and the
 * account, and this counter is new.
 *
 * ⚠️ What six digits do invite is a date of birth, which is why the obvious ones are
 * refused. That still leaves roughly 36 500 date-shaped PINs out of a million, so this
 * narrows the field rather than closing it — the limits and the block are the security
 * model (PS-017), not the PIN.
 */
export const isValidThankYouCardPin = (pin: string): boolean => {
  if (!/^\d{6}$/.test(pin)) {
    return false
  }
  if (/^(\d)\1{5}$/.test(pin)) {
    return false // all the same digit
  }
  if (isRun(pin)) {
    return false // 123456 and 654321 and everything between
  }
  if (/^(19|20)\d{4}$/.test(pin)) {
    return false // a year at the front reads as a date of birth
  }
  return true
}

const isRun = (pin: string): boolean => {
  const digits = [...pin].map(Number)
  const step = digits[1] - digits[0]
  if (step !== 1 && step !== -1) {
    return false
  }
  return digits.every((digit, index) => index === 0 || digit - digits[index - 1] === step)
}

/**
 * The start of the day a payment is counted against, in the server's timezone.
 *
 * ⚠️ "Per day" needs a boundary somewhere, and there is no good one: the card is used
 * wherever its owner happens to be, and the account does not know which timezone that
 * is. Server midnight is the honest choice — it is at least the same boundary for
 * everybody, and it is the one the limits page can name.
 */
export const startOfDay = (now: Date): Date => {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return start
}

/**
 * Midnight at the end of that same day, so that the two together bound exactly one day.
 *
 * ⚠️ A day needs BOTH ends here, unlike in most "since when" questions. A request is
 * counted against the day it was created, and it stays payable for fifteen minutes — so
 * one created at 23:58 and paid at 00:02 belongs to the day before, and summing "its day
 * and everything after" would quietly mix two days together.
 *
 * Built on the calendar rather than on 24 hours, so the day the clocks change is still
 * one day.
 */
export const startOfNextDay = (now: Date): Date => {
  const start = startOfDay(now)
  start.setDate(start.getDate() + 1)
  return start
}

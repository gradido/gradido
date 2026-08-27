// AI-GENERATED — not an architecture reference
import { registerEnumType } from 'type-graphql'

/**
 * How a card payment ended.
 *
 * These are codes, not sentences, on purpose: the backend does not know which language
 * the person at the counter reads, so every wording it invented would be wrong for
 * somebody. The wallet turns the code into a sentence from its own locale files.
 *
 * ⚠️ CARD_UNKNOWN and CARD_BLOCKED are kept apart although both mean "this will not
 * work". A merchant who scanned a card that is blocked has to know to stop trying, and
 * neither answer says anything about a person — the card was in their hand either way.
 */
export enum ThankYouCardPaymentStatus {
  SUCCESS = 'SUCCESS',
  CARD_UNKNOWN = 'CARD_UNKNOWN',
  CARD_BLOCKED = 'CARD_BLOCKED',
  CARD_NOT_SET_UP = 'CARD_NOT_SET_UP',
  /** Somebody scanned their own card. Nothing bad, but nothing to do either. */
  OWN_CARD = 'OWN_CARD',
  WRONG_PIN = 'WRONG_PIN',
  /** The third wrong PIN. The card is dead until its owner unblocks it in their wallet. */
  BLOCKED_NOW = 'BLOCKED_NOW',
  LIMIT_PER_PAYMENT_EXCEEDED = 'LIMIT_PER_PAYMENT_EXCEEDED',
  LIMIT_PER_DAY_EXCEEDED = 'LIMIT_PER_DAY_EXCEEDED',
  NOT_ENOUGH_GDD = 'NOT_ENOUGH_GDD',
  /** Nobody typed the PIN in time, or somebody already used this request. */
  REQUEST_GONE = 'REQUEST_GONE',
}

registerEnumType(ThankYouCardPaymentStatus, {
  name: 'ThankYouCardPaymentStatus',
  description: 'How a payment with a printed thank you card ended',
})

// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'
import { ThankYouCardPaymentStatus } from '@/graphql/enum/ThankYouCardPaymentStatus'

/**
 * What a scanned card is good for, before anybody types anything.
 *
 * ★ `cardLabel` is the ONE thing this answer may name about the card, and the reason is
 * that it is not news: the label is PRINTED ON THE CARD. Whoever asked this question is
 * holding that card and can read it. Showing it back confirms which card the device
 * currently has — the point of the whole field, because a till that scanned three cards in
 * a row gives no other sign of which one is still loaded.
 *
 * ⛔ Only on SUCCESS. Nowhere else is there anything to confirm, and naming the label of a
 * BLOCKED card would tell whoever found it that their code belongs to a real, known card.
 * The owner's name stays out of this answer entirely and appears only after the PIN.
 */
@ObjectType()
export class ThankYouCardPaymentTarget {
  constructor(status: ThankYouCardPaymentStatus, cardLabel?: string) {
    this.status = status
    this.cardLabel = cardLabel
  }

  @Field(() => ThankYouCardPaymentStatus)
  status: ThankYouCardPaymentStatus

  /** The word the owner wrote on the card. Only set on SUCCESS. */
  @Field(() => String, { nullable: true })
  cardLabel?: string
}

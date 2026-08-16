// AI-GENERATED — not an architecture reference
import { ThankYouCardSelect } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * One printed card, as its owner sees it in their own settings.
 *
 * ⚠️ The code is part of this answer on purpose: the card is drawn in the browser, so
 * the wallet needs it to make the QR. That is safe because every call that returns this
 * is filtered on the caller's own user id — but it means this type must never be reached
 * from anywhere the caller is not the owner.
 */
@ObjectType()
export class ThankYouCard {
  constructor(dbCard: ThankYouCardSelect) {
    this.id = dbCard.id
    this.code = dbCard.code
    this.label = dbCard.label
    this.blockedAt = dbCard.blockedAt
    this.createdAt = dbCard.createdAt
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  code: string

  @Field(() => String)
  label: string

  /** Null while the card works. A date is the moment it died, and it is kept. */
  @Field(() => Date, { nullable: true })
  blockedAt: Date | null

  @Field(() => Date)
  createdAt: Date
}

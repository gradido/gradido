// AI-GENERATED — not an architecture reference
import { TransactionPictureHead } from 'database'
import { Field, ObjectType } from 'type-graphql'

/**
 * The picture a member sent with a transfer, as the booking list names it: the motif's key, or
 * that it is a photo of the member's own. In the names of ThankYouGreeting, its sibling.
 *
 * `motif` is a plain string (shared/src/data/ThankYouGreeting.logic.ts says why): a wallet older than the
 * server reads a motif it does not know as a text it has no picture for.
 */
@ObjectType()
export class TransactionPicture {
  constructor(head: Pick<TransactionPictureHead, 'motif'>) {
    this.motif = head.motif
    this.hasPicture = head.motif === null
  }

  @Field(() => String, { nullable: true })
  motif: string | null

  /**
   * Whether the picture is a photo of the member's own: a picture is a motif or a photo, so it
   * is said by the row itself -- the booking list learns it without a look at the table with
   * the bytes.
   *
   * ⛔ Only THAT there is one. The photo is in no list: it comes to the two the booking is
   * between, each by the id of their own row, through transactionPicture.
   */
  @Field(() => Boolean)
  hasPicture: boolean
}

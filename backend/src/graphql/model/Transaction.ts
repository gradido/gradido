import { TransactionTypeId } from 'core'
import { Transaction as dbTransaction } from 'database'
import { GradidoUnit } from 'shared'
import { Field, Int, ObjectType } from 'type-graphql'
import { Decay } from './Decay'
import { ThankYouGreeting } from './ThankYouGreeting'
import { TransactionPicture } from './TransactionPicture'
import { User } from './User'

@ObjectType()
export class Transaction {
  constructor(
    transaction: dbTransaction,
    user: User,
    linkedUser: User | null = null,
    thankYouCardLabel: string | null = null,
    greeting: ThankYouGreeting | null = null,
    picture: TransactionPicture | null = null,
    reaction: string | null = null,
    canReact = false,
  ) {
    this.id = transaction.id
    this.user = user
    this.previous = transaction.previous
    this.typeId = transaction.typeId
    this.amount = transaction.amount
    this.balance = transaction.balance
    this.balanceDate = transaction.balanceDate
    this.decay = Decay.createFromDBTransaction(transaction)
    this.memo = transaction.memo
    this.creationDate = transaction.creationDate
    this.linkedUser = linkedUser
    this.linkedTransactionId = transaction.linkedTransactionId ?? null
    this.linkId = transaction.contribution
      ? transaction.contribution.contributionLinkId
      : (transaction.transactionLinkId ?? null)
    this.previousBalance = transaction.previousTransaction?.balance ?? new GradidoUnit(0n)
    this.viaThankYouCard =
      transaction.thankYouCardId !== null && transaction.thankYouCardId !== undefined
    this.thankYouCardLabel = thankYouCardLabel
    this.greeting = greeting
    this.picture = picture
    this.reaction = reaction
    this.canReact = canReact
  }

  @Field(() => Int)
  id: number

  @Field(() => User)
  user: User

  @Field(() => Int, { nullable: true })
  previous: number | null

  @Field(() => TransactionTypeId)
  typeId: TransactionTypeId

  @Field(() => GradidoUnit)
  amount: GradidoUnit

  @Field(() => GradidoUnit)
  balance: GradidoUnit

  @Field(() => Date)
  balanceDate: Date

  @Field(() => GradidoUnit)
  previousBalance: GradidoUnit

  @Field(() => Decay)
  decay: Decay

  @Field(() => String)
  memo: string

  @Field(() => Date, { nullable: true })
  creationDate: Date | null

  @Field(() => User, { nullable: true })
  linkedUser: User | null

  @Field(() => Int, { nullable: true })
  linkedTransactionId: number | null

  // Links to the TransactionLink/ContributionLink when transaction was created by a link
  @Field(() => Int, { nullable: true })
  linkId: number | null

  /**
   * This booking was paid with a printed thank you card. True on BOTH sides — the till is
   * told as much as the payer here, and no more.
   */
  @Field(() => Boolean)
  viaThankYouCard: boolean

  /**
   * ⛔ The name the OWNER wrote on their card, and it reaches nobody else.
   *
   * Filled only on a SEND row, which on somebody's own booking list means "I paid with my
   * own card" — so it answers *which one was that?* for a member who has had several cards
   * over time. The till's RECEIVE row leaves it null: they held the card for a moment, but
   * in their own history somebody else's word for it is none of their business.
   */
  @Field(() => String, { nullable: true })
  thankYouCardLabel: string | null

  /**
   * The thank-you greeting of the link this booking was made from: its motif, its first line
   * and whom it was for -- what the conversation of the two shows with the booking. Null for
   * every other booking: a plain link, a transfer, a creation.
   *
   * On both rows, the sender's and the recipient's, and on nobody else's list: a booking list
   * is always the member's own. The line is also the beginning of `memo`.
   *
   * Which bookings can have one is decided where the list is built
   * (data/Transaction.logic.ts): `linkId` above is no way to it.
   */
  @Field(() => ThankYouGreeting, { nullable: true })
  greeting: ThankYouGreeting | null

  /**
   * The picture the sender added to this transfer: its motif, or that it is a photo of their
   * own -- what the conversation of the two shows with the booking. Null for every other
   * booking, and for a booking made from a link: that one has a greeting or nothing.
   *
   * On both rows, the sender's and the recipient's, and on nobody else's list: a booking list
   * is always the member's own. The photo itself is not here; `id` above is what
   * transactionPicture is asked with.
   */
  @Field(() => TransactionPicture, { nullable: true })
  picture: TransactionPicture | null

  /**
   * The emoji the RECIPIENT of this transfer answered it with (migration 0159), or null: one of
   * the wallet's forty-eight. On both rows, the recipient's RECEIVE row and the sender's SEND
   * row, and on nobody else's list: a booking list is always the member's own.
   *
   * Null for every booking that is no transfer between two members of this server. Which
   * booking gets which reaction is decided where the list is built (TransactionReaction.logic):
   * `linkedTransactionId` above alone is no way to it.
   */
  @Field(() => String, { nullable: true })
  reaction: string | null

  /**
   * Whether the member whose list this is may react to the booking (setTransactionReaction):
   * true on their own RECEIVE row of a transfer from a member of this server, false on
   * everything else -- only the recipient reacts. Said here so that no screen has to decide it.
   */
  @Field(() => Boolean)
  canReact: boolean
}

import { TransactionTypeId } from 'core'
import { Transaction as dbTransaction } from 'database'
import { GradidoUnit } from 'shared'
import { Field, Int, ObjectType } from 'type-graphql'
import { Decay } from './Decay'
import { ThankYouGreeting } from './ThankYouGreeting'
import { User } from './User'

@ObjectType()
export class Transaction {
  constructor(
    transaction: dbTransaction,
    user: User,
    linkedUser: User | null = null,
    thankYouCardLabel: string | null = null,
    greeting: ThankYouGreeting | null = null,
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
}

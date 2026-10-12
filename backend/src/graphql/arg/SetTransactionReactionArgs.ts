// AI-GENERATED — not an architecture reference
import { IsInt, IsPositive, IsString, MaxLength } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/**
 * The recipient's reaction to a transfer (migration 0159): which transfer, by the id of the
 * caller's own RECEIVE booking -- the id their booking list carries --, and the emoji, or none
 * to take the reaction back.
 *
 * The bound is the column's (transaction_reactions.emoji). Which emoji is one a member may react
 * with is not a matter of length: setTransactionReaction holds it against the list
 * (chatReactionEmojiSchema).
 */
@ArgsType()
export class SetTransactionReactionArgs {
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  transactionId: number

  /** Absent or null takes the reaction back. */
  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(16)
  emoji?: string | null
}

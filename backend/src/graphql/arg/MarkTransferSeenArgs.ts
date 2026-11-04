// AI-GENERATED — not an architecture reference
import { IsInt, IsPositive } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/** One transfer the member received, seen: opened in the booking list (Chat E-086). */
@ArgsType()
export class MarkTransferSeenArgs {
  /** The member's RECEIVE booking of the transfer, by its id. */
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  transactionId: number
}

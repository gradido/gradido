import { ChatImageInput } from '@input/ChatImageInput'
import { IsInt, IsPositive, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator'
import { GradidoUnit, MEMO_MAX_CHARS, MEMO_MIN_CHARS } from 'shared'
import { ArgsType, Field, Int } from 'type-graphql'
import { IsPositiveGradidoUnit } from '@/graphql/validator/GradidoUnit'

@ArgsType()
export class TransactionSendArgs {
  @Field(() => String)
  @IsString()
  recipientCommunityIdentifier: string

  @Field(() => String)
  @IsString()
  recipientIdentifier: string

  @Field(() => GradidoUnit)
  @IsPositiveGradidoUnit()
  amount: GradidoUnit

  @Field(() => String)
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo: string

  /**
   * A picture with the transfer, for a recipient in the sender's own community: one of the
   * motifs of the thank-you greeting by its key, or -- as `picture` -- a photo of the member's
   * own, which is a chat picture in every bound. At most one of the two; what they may hold is
   * checked in the resolver (transactionPictureSchema, acceptedPicture). Without either,
   * nothing changes.
   *
   * ⛔ A motif or bytes, never the id of a picture: no argument takes a picture's id from
   * outside.
   */
  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(32)
  motif?: string | null

  @Field(() => ChatImageInput, { nullable: true })
  @ValidateNested()
  picture?: ChatImageInput | null

  /**
   * The received thank-you this transfer passes on, where the wallet's "Jemandem danken" led to
   * it: the id of the sender's OWN RECEIVE booking of that thank-you. Kept as the trail of the
   * transfer (`transaction_pass_ons`) for a recipient in the sender's own community only. An id
   * that is no such booking, and any id across the border, is dropped -- never booked, and never
   * a refusal of the transfer.
   */
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsPositive()
  passOnOf?: number | null
}

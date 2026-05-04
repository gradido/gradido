import { IsString, MaxLength, MinLength } from 'class-validator'
import { GradidoUnit, MEMO_MAX_CHARS, MEMO_MIN_CHARS } from 'shared'
import { ArgsType, Field } from 'type-graphql'
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
}

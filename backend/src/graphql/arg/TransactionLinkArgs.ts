import { MaxLength, MinLength } from 'class-validator'
import { GradidoUnit } from 'shared'
import { ArgsType, Field } from 'type-graphql'
import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from '@/graphql/resolver/const/const'
import { IsPositiveGradidoUnit } from '../validator/GradidoUnit'

@ArgsType()
export class TransactionLinkArgs {
  @Field(() => GradidoUnit)
  @IsPositiveGradidoUnit()
  amount: GradidoUnit

  @Field(() => String)
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo: string
}

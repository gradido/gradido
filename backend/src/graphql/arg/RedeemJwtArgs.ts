import { MaxLength, MinLength } from 'class-validator'
import { Decimal } from 'decimal.js-light'
import { Field, ArgsType, InputType } from 'type-graphql'

import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from '@/graphql/resolver/const/const'
import { IsPositiveDecimal } from '@/graphql/validator/Decimal'

@InputType()
@ArgsType()
export class RedeemJwtArgs {
  @Field(() => String, { nullable: false })
  gradidoID!: string

  @Field(() => String, { nullable: true })
  firstName?: string

  @Field(() => String, { nullable: true })
  alias?: string

  @Field(() => String, { nullable: false })
  communityUuid!: string

  @Field(() => String, { nullable: false })
  communityName!: string

  @Field(() => String, { nullable: false })
  code!: string

  @Field(() => Decimal, { nullable: false })
  @IsPositiveDecimal()
  amount!: Decimal

  @Field(() => String, { nullable: false })
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo!: string
}

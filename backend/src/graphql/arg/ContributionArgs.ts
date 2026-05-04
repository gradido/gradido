import { MaxLength, MinLength } from 'class-validator'
import { GradidoUnit, MEMO_MAX_CHARS, MEMO_MIN_CHARS } from 'shared'
import { ArgsType, Field, InputType } from 'type-graphql'
import { isValidDateString } from '@/graphql/validator/DateString'
import { IsPositiveGradidoUnit } from '@/graphql/validator/GradidoUnit'

@InputType()
@ArgsType()
export class ContributionArgs {
  @Field(() => GradidoUnit)
  @IsPositiveGradidoUnit()
  amount: GradidoUnit

  @Field(() => String)
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo: string

  @Field(() => String)
  @isValidDateString()
  contributionDate: string
}

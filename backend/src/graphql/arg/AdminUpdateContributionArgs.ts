import { IsPositive, MaxLength, MinLength } from 'class-validator'
import { GradidoUnit, MEMO_MAX_CHARS, MEMO_MIN_CHARS } from 'shared'
import { ArgsType, Field, Int } from 'type-graphql'
import { isValidDateString } from '@/graphql/validator/DateString'
import { IsPositiveGradidoUnit } from '@/graphql/validator/GradidoUnit'

@ArgsType()
export class AdminUpdateContributionArgs {
  @Field(() => Int)
  @IsPositive()
  id: number

  @Field(() => GradidoUnit, { nullable: true })
  @IsPositiveGradidoUnit()
  amount?: GradidoUnit | null

  @Field(() => String, { nullable: true })
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo?: string | null

  @Field(() => String, { nullable: true })
  @isValidDateString()
  creationDate?: string | null

  @Field(() => String, { nullable: true })
  @isValidDateString()
  resubmissionAt?: string | null
}

import { IsInt, IsString, IsEnum } from 'class-validator'
import { ArgsType, Field, Int, InputType } from 'type-graphql'

import { ContributionMessageType } from '@enum/ContributionMessageType'

import { isValidDateString } from '@/graphql/validator/DateString'

@InputType()
@ArgsType()
export class ContributionMessageArgs {
  @Field(() => Int)
  @IsInt()
  contributionId: number

  @Field(() => String)
  @IsString()
  message: string

  @Field(() => ContributionMessageType, { defaultValue: ContributionMessageType.DIALOG })
  @IsEnum(ContributionMessageType)
  messageType: ContributionMessageType

  @Field(() => String, { nullable: true })
  @isValidDateString()
  resubmissionAt?: string | null
}

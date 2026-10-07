import { ContributionMessageType } from '@enum/ContributionMessageType'
import { IsEnum, IsInt, IsString } from 'class-validator'
import { ArgsType, Field, InputType, Int } from 'type-graphql'

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

  // nullable beside the default, see Paginated
  @Field(() => ContributionMessageType, {
    nullable: true,
    defaultValue: ContributionMessageType.DIALOG,
  })
  @IsEnum(ContributionMessageType)
  messageType: ContributionMessageType

  @Field(() => String, { nullable: true })
  @isValidDateString()
  resubmissionAt?: string | null
}

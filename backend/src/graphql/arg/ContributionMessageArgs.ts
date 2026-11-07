import { ContributionMessageType } from '@enum/ContributionMessageType'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
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

  @Field(() => ContributionMessageType, { defaultValue: ContributionMessageType.DIALOG })
  @IsEnum(ContributionMessageType)
  messageType: ContributionMessageType

  @Field(() => String, { nullable: true })
  @isValidDateString()
  resubmissionAt?: string | null

  /**
   * The language model whose words the message carries, by name -- the admin sends the
   * model of the Crea draft it inserted, the first creation the model that wrote its lines.
   * Recorded on the message (`contribution_messages.ai_model`). A member's own message
   * never carries one: the member path ignores it.
   */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  aiModel?: string | null
}

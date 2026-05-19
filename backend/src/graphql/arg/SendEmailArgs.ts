import { IsString, MaxLength, MinLength } from 'class-validator'
import { MEMO_MAX_CHARS, MEMO_MIN_CHARS } from 'shared'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class SendEmailArgs {
  @Field(() => String)
  @IsString()
  recipientCommunityIdentifier: string

  @Field(() => String)
  @IsString()
  recipientIdentifier: string

  @Field(() => String)
  @IsString()
  subject: string

  @Field(() => String)
  @MaxLength(MEMO_MAX_CHARS)
  @MinLength(MEMO_MIN_CHARS)
  memo: string
}

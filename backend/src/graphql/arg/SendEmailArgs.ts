import { IsString, MaxLength, MinLength } from 'class-validator'
import { MESSAGE_MAX_CHARS, MESSAGE_MIN_CHARS } from 'shared'
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

  // this memo carries no amount, so it uses the roomier message bounds and not
  // the memo bounds that a transaction memo has to obey
  @Field(() => String)
  @MaxLength(MESSAGE_MAX_CHARS)
  @MinLength(MESSAGE_MIN_CHARS)
  memo: string
}

// AI-GENERATED — not an architecture reference
import { IsInt, IsPositive, IsString, MaxLength } from 'class-validator'
import { USER_REMARK_MAX_CHARS } from 'shared'
import { ArgsType, Field, Int } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/** The moderation's remark on a member, written anew; an emptied remark takes it away. */
@ArgsType()
export class SetUserRemarkArgs {
  /** The member it is about: their number, as a contribution carries it. */
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  userId: number

  /** At most USER_REMARK_MAX_CHARS: what the admin's field lets through. Empty is allowed. */
  @Field(() => String)
  @IsString()
  @MaxLength(USER_REMARK_MAX_CHARS)
  remark: string
}

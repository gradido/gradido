// AI-GENERATED — not an architecture reference
import { IsInt, IsPositive, IsUUID } from 'class-validator'
import { ArgsType, Field, Int } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema

/** The group, read up to this message (E-017) -- as a thread is (MarkChatConversationReadArgs). */
@ArgsType()
export class MarkChatGroupReadArgs {
  @Field(() => String)
  @IsUUID('4')
  groupUuid: string

  /** The highest message id the member was SHOWN -- not the highest there is. */
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  upToMessageId: number
}

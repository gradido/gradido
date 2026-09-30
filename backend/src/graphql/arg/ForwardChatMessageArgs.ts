// AI-GENERATED — not an architecture reference
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { MESSAGE_MAX_CHARS } from 'shared'
import { ArgsType, Field } from 'type-graphql'
import { CHAT_FORWARD_MAX_TARGETS } from '@/data/ChatConversation.logic'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/**
 * A message forwarded into other conversations (Bernd, 30.09.2026, E-059): which one, by its uuid;
 * into which groups and to which members of this community; the sender's own words to go with
 * it; and whether the members should get a mail about it as well.
 *
 * The limits sit here as well as in the resolver: each list is refused here before a single row
 * is read, the resolver counts both together (CHAT_FORWARD_MAX_TARGETS).
 */
@ArgsType()
export class ForwardChatMessageArgs {
  @Field(() => String)
  @IsUUID('4')
  messageUuid: string

  @Field(() => [String])
  @IsArray()
  @ArrayMaxSize(CHAT_FORWARD_MAX_TARGETS)
  @IsUUID('4', { each: true })
  groupUuids: string[]

  /** Members of this community, by the pair the contact list holds (KF-004). */
  @Field(() => [MemberAvatarRefInput])
  @IsArray()
  @ArrayMaxSize(CHAT_FORWARD_MAX_TARGETS)
  @ValidateNested({ each: true })
  members: MemberAvatarRefInput[]

  /**
   * What the sender writes to go with it (E-059 F4): a message of its own right after the copy, in
   * every conversation. Empty or only spaces: none.
   */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(MESSAGE_MAX_CHARS)
  words?: string | null

  /**
   * The box "Auch per E-Mail" (E-024), for the members: the first message of a pair goes by mail
   * in any case. Into a group a copy goes without an announcement.
   */
  @Field(() => Boolean)
  @IsBoolean()
  alsoByEmail: boolean
}

// AI-GENERATED — not an architecture reference
import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { Field, InputType } from 'type-graphql'

/**
 * A server of the chat's video calls as an administrator enters it on the admin page "Chat"
 * (V3). The rules for the values are those of CHAT_VIDEO_SERVERS (chatVideoServerFromForm): an
 * https address without query, fragment or user, a prefix of letters and digits, and nothing
 * longer than its column. Empty operator, prefix and note mean none.
 */
@InputType()
export class ChatVideoServerInput {
  @Field(() => String)
  @IsString()
  baseUrl: string

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  operator?: string | null

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  roomPrefix?: string | null

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  note?: string | null

  /** The tick "in the random choice". */
  @Field(() => Boolean)
  @IsBoolean()
  active: boolean
}

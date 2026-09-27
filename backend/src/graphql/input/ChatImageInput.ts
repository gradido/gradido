// AI-GENERATED — not an architecture reference
import { IsInt, IsString, Max, Min } from 'class-validator'
import { CHAT_IMAGE_MAX_SIDE } from 'shared'
import { Field, InputType, Int } from 'type-graphql'

// TODO: replace the class-validator decorators with a valibot schema after the update to
// typescript 5 is possible

/**
 * A picture in a chat message (P7), as the wallet sends it: the JPEG as base64, without a data
 * URI prefix, and its size in pixels.
 *
 * The wallet has scaled it down and encoded it (an area of 800 x 600, under 55 KB, E-041). The
 * server checks it the way it checks the avatar -- its size and its JPEG markers, with no
 * decoder (acceptChatMessageImage in `core`). Width and height are the wallet's word: without a
 * decoder they cannot be measured here, only bounded -- each side here, the area there. What
 * they steer is the room the bubble of this message keeps for the picture before it has come.
 */
@InputType()
export class ChatImageInput {
  @Field(() => String)
  @IsString()
  data: string

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(CHAT_IMAGE_MAX_SIDE)
  width: number

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(CHAT_IMAGE_MAX_SIDE)
  height: number
}

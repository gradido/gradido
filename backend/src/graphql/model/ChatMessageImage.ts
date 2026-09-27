// AI-GENERATED — not an architecture reference
import { ChatMessageImageInfo } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * A picture in a chat message (P7), as the message names it: what to fetch it by
 * (chatMessageImage), and its size, which the bubble takes its room from before it has come.
 * Never the picture itself -- a page of a hundred messages would carry megabytes.
 */
@ObjectType()
export class ChatMessageImage {
  constructor(info: ChatMessageImageInfo) {
    this.imageUuid = info.imageUuid
    this.width = info.width
    this.height = info.height
  }

  @Field(() => String)
  imageUuid: string

  @Field(() => Int)
  width: number

  @Field(() => Int)
  height: number
}

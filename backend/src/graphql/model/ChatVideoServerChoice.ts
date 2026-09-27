// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * A server a member may choose for a video call (V5): one chatVideoRoom hands rooms out on right
 * now -- ticked in the admin page's list and passed the last check. What the wallet's choice
 * shows and sends back, and nothing of the list's own business (address, prefix, remark, the
 * check's figures): those are the administrator's (ChatVideoServerRow).
 */
@ObjectType()
export class ChatVideoServerChoice {
  constructor(id: number, host: string, operator: string | null) {
    this.id = id
    this.host = host
    this.operator = operator
  }

  /** The row of chat_video_servers -- what chatVideoRoom takes as `serverId`. */
  @Field(() => Int)
  id: number

  /** The server's host, as the invitation names it where the list names no operator. */
  @Field(() => String)
  host: string

  /** Who runs the server, as the list names them; null where it names nobody. */
  @Field(() => String, { nullable: true })
  operator: string | null
}

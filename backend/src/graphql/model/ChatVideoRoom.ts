// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/**
 * A fresh video room for a call the caller is about to start (V1): on a Jitsi server that passed
 * its last check (every ten minutes; how old one may be: CHAT_VIDEO_CHECK_MAX_AGE_MS), under a
 * name nobody else has. The wallet sends `url` as an ordinary chat message and names who runs
 * the server -- a suggestion, not a service of Gradido's (V2).
 *
 * ⚠️ Every call hands out another room. A client must not answer a second call from its cache
 * (Apollo: fetchPolicy 'no-cache'), or two conversations would share one room.
 */
@ObjectType()
export class ChatVideoRoom {
  constructor(url: string, host: string, operator: string | null) {
    this.url = url
    this.host = host
    this.operator = operator
  }

  /** The room's address: the server's base address, then its prefix and 12 random characters. */
  @Field(() => String)
  url: string

  /** The server's host -- what the wallet names where the list names no operator. */
  @Field(() => String)
  host: string

  /** Who runs the server, as the list names them; null where it names nobody. */
  @Field(() => String, { nullable: true })
  operator: string | null
}

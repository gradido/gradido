// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'
import { ChatReactionCount } from '@/data/ChatReaction.logic'

/**
 * One emoji under a chat message (migration 0158), as the member reading the message sees it:
 * the emoji, how many members of the conversation reacted with it, and whether the reader is one
 * of them. It names nobody else.
 */
@ObjectType()
export class ChatMessageReaction {
  constructor({ emoji, count, mine }: ChatReactionCount) {
    this.emoji = emoji
    this.count = count
    this.mine = mine
  }

  /** One of the wallet's forty-eight, as it was sent -- with its selector where it has one. */
  @Field(() => String)
  emoji: string

  @Field(() => Int)
  count: number

  /** Whether the member reading reacted with it: a press on it takes that back. */
  @Field(() => Boolean)
  mine: boolean
}

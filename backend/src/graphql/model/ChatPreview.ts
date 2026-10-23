// AI-GENERATED — not an architecture reference
import { GradidoUnit } from 'shared'
import { Field, ObjectType } from 'type-graphql'
import { User } from './User'

/**
 * What the line under a name on "Kontakte & Chat" shows (E-083, Bernd, 23.10.2026): the beginning
 * of the latest message -- or, with a person, of the latest booking, where that came after the
 * last message --, so that one sees at once what was last said.
 *
 * Read whenever the list is handed out, from the message or the booking as it stands then: nothing
 * of it is filed anywhere, and a message changed since shows its new words.
 */
@ObjectType()
export class ChatPreview {
  constructor(fields: {
    mine: boolean
    excerpt: string
    hasImage: boolean
    amount: GradidoUnit | null
    senderUser: User | null
    at: Date
  }) {
    this.mine = fields.mine
    this.excerpt = fields.excerpt
    this.hasImage = fields.hasImage
    this.amount = fields.amount
    this.senderUser = fields.senderUser
    this.at = fields.at
  }

  /** Whether the member asking wrote the message, or gave the Gradido of the booking. */
  @Field(() => Boolean)
  mine: boolean

  /**
   * The beginning of the words, raw as they were written -- a message's text or a booking's memo,
   * CHAT_QUOTE_MAX_CHARS at most, as an answer quotes a message: the line is one line, cut off by
   * the wallet where it ends. Empty for a picture without words.
   */
  @Field(() => String)
  excerpt: string

  /** Whether the message carries a picture: the line says so, and shows none. */
  @Field(() => Boolean)
  hasImage: boolean

  /**
   * Set on a booking only: the Gradido it moved, without their sign -- `mine` says which way they
   * went. Null for a message.
   */
  @Field(() => GradidoUnit, { nullable: true })
  amount: GradidoUnit | null

  /**
   * Who wrote the message, in a group -- as ChatMessage.senderUser names the writer of a group's
   * message. Null with one person, where the list knows both, and for a booking.
   */
  @Field(() => User, { nullable: true })
  senderUser: User | null

  /**
   * When the message arrived here, or the booking was booked: what decides which of the two the
   * line of a person shows. Not in the schema -- the row says "last on …" already.
   */
  at: Date
}

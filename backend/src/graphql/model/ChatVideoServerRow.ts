// AI-GENERATED — not an architecture reference
import type { ChatVideoServerSelect } from 'database'
import { Field, Int, ObjectType } from 'type-graphql'
import { ChatVideoServerCheck } from './ChatVideoServerCheck'

// What names the server. A row written past the admin page may hold an address that does not
// parse; the admin page then shows it as it is, so that it can be corrected or deleted.
const hostOf = (baseUrl: string): string => {
  try {
    return new URL(baseUrl).host
  } catch {
    return baseUrl
  }
}

/**
 * A server of the chat's video calls as the admin page "Chat" shows it (V3): a row of
 * chat_video_servers, and what the last check found about it.
 */
@ObjectType()
export class ChatVideoServerRow {
  constructor(row: ChatVideoServerSelect, check: ChatVideoServerCheck | null) {
    this.id = row.id
    this.baseUrl = row.baseUrl
    this.host = hostOf(row.baseUrl)
    this.operator = row.operator
    this.roomPrefix = row.roomPrefix
    this.note = row.note
    this.active = row.active
    this.createdAt = row.createdAt
    this.updatedAt = row.updatedAt
    this.check = check
  }

  @Field(() => Int)
  id: number

  /** Where the rooms are: https, ending in '/'. */
  @Field(() => String)
  baseUrl: string

  @Field(() => String)
  host: string

  /** Who runs the server, as its imprint names them; null where nobody is named. */
  @Field(() => String, { nullable: true })
  operator: string | null

  /** What every room name there starts with; null for none. */
  @Field(() => String, { nullable: true })
  roomPrefix: string | null

  /** The administrator's remark. */
  @Field(() => String, { nullable: true })
  note: string | null

  /** The tick "in the random choice": only active servers are handed out; all are checked. */
  @Field(() => Boolean)
  active: boolean

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date, { nullable: true })
  updatedAt: Date | null

  /**
   * What the last check found; null until a check went to this address -- a new row, and a row
   * whose address changed, until the next check is through.
   */
  @Field(() => ChatVideoServerCheck, { nullable: true })
  check: ChatVideoServerCheck | null
}

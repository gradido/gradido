// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'
import type { ChatVideoServerState } from '@/apis/jitsi/chatVideoServerPool'

/**
 * What the last check found about a server of the chat's video calls (V3): the view of the
 * running process (chatVideoServerPool), not stored -- it starts afresh with the process, and so
 * does `picks`. Nothing here names a member.
 */
@ObjectType()
export class ChatVideoServerCheck {
  constructor(state: ChatVideoServerState) {
    this.ok = state.ok
    this.reason = state.reason
    this.checkedAt = state.checkedAt
    this.latencyMs = state.latencyMs
    this.picks = state.picks
  }

  /** Whether it answered as the calls need it: a Jitsi whose rooms open without an account. */
  @Field(() => Boolean)
  ok: boolean

  /**
   * Why not, as the check's code: UNREACHABLE, NOT_JITSI, LOGIN_REQUIRED, NO_ANONYMOUS or
   * NO_BOSH (apis/jitsi/jitsiProbe.logic.ts). The admin page puts it in words.
   */
  @Field(() => String, { nullable: true })
  reason: string | null

  /** When the check that found this was through. */
  @Field(() => Date)
  checkedAt: Date

  /** How long its two answers took together, where it answered. */
  @Field(() => Int, { nullable: true })
  latencyMs: number | null

  /** How many invitations went out on it since the process started. */
  @Field(() => Int)
  picks: number
}

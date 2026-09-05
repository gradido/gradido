// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/** One entry as the window shows it after saving: the sentence and whether it is booked. */
@ObjectType()
export class FirstCreationEntry {
  @Field()
  memo: string

  /**
   * Read off the contribution (`confirmed_at`), not off the process row: when the
   * moderation confirms by hand after IN_REVIEW, the ticks appear without the first
   * creation knowing about it (G §3.5).
   */
  @Field()
  confirmed: boolean

  /**
   * PENDING | IN_PROGRESS | CONFIRMED | DENIED | DELETED, read off the contribution - so a
   * bundle the moderation refused or removed does not look like one still waiting.
   */
  @Field()
  status: string
}

/**
 * Where the member stands with their first creation — one query for the window, like
 * aliasStatus for the name. ⚠️ No arguments, so the wallet must read it with
 * `cache-and-network` (one cache key for everybody, cleared on logout).
 */
@ObjectType()
export class FirstCreationStatus {
  /** NONE | FORCED | SUBMITTED | IN_REVIEW | DONE | DONE_UNBOOKED */
  @Field()
  state: string

  /** ES-011 plus a configured signer: whether the window opens. */
  @Field()
  eligible: boolean

  /** The message of thanks (DONE, DONE_UNBOOKED) or the review notice (IN_REVIEW). */
  @Field(() => String, { nullable: true })
  message: string | null

  @Field(() => [FirstCreationEntry])
  entries: FirstCreationEntry[]

  /** L4 — the function-test area; false until it exists. */
  @Field()
  functionTestsEnabled: boolean

  /** L4 — how many test runs the month still allows; null until it exists. */
  @Field(() => Int, { nullable: true })
  testRunsLeft: number | null
}

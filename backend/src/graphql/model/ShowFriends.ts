// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/**
 * Somebody who arrived over this member: their public name, when they got here, and
 * whether they are the first ever. `first` carries "only first times" (ZE-006) - the warm
 * sentence belongs to the first arrival in the life of an account, every further one is
 * reported plainly.
 */
@ObjectType()
export class ShowFriendsArrival {
  @Field()
  alias: string

  @Field(() => Date)
  createdAt: Date

  @Field()
  first: boolean
}

/**
 * What the wallet needs for "show it to your friends": whom to offer thanks to, and whose
 * arrival to mirror back.
 *
 * ⛔ Its own query rather than two fields on `User`: that type serves the wallet AND the
 * admin out of one schema, so a field there is readable by more callers than this is
 * meant for. And ⛔ not in `login` either - almost every backend test signs in, so a
 * lookup there is a lookup in everybody's path.
 *
 * ⚠️ No arguments, so the wallet reads it with `cache-and-network`: one cache key for
 * everybody, and a member who switches accounts must not see the other one's arrival.
 *
 * ⛔ No count, ever (ZE-007): a number would make this a scoreboard, and the whole point
 * is that it is a mirror.
 */
@ObjectType()
export class ShowFriends {
  /** The public name of whoever brought the caller here, or null when nobody did. */
  @Field(() => String, { nullable: true })
  referrerAlias: string | null

  /** The most recent CONFIRMED arrival over the caller, or null when there is none. */
  @Field(() => ShowFriendsArrival, { nullable: true })
  latestArrival: ShowFriendsArrival | null
}

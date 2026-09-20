// AI-GENERATED — not an architecture reference
import { Field, Int, ObjectType } from 'type-graphql'

/**
 * Somebody who arrived over this member: who they are, their public name, when they got
 * here, and whether they are the only one. `first` carries "only first times" (ZE-006) -
 * the warm sentence belongs to the first arrival, every further one is reported plainly.
 *
 * ⚠️ Measured on the arrivals still there. An arrival who has since deleted their account
 * leaves none, so a later one is greeted as the first - see `dbFindLatestArrival`.
 */
@ObjectType()
export class ShowFriendsArrival {
  /**
   * Which member this is, so the tile can offer a way to REACH them and not only name
   * them (ZE-010): the wallet hands this straight to the contact window.
   *
   * ⛔ No new disclosure, and that is why it is a field here rather than a question of
   * its own. Where a member has not chosen a user name, `publicAlias` puts this very
   * identifier in `alias` - so the tile has been showing it all along - and since the
   * referral trace became the contact list's second source, the same caller is told the
   * same arrival's identifier by `contactList` anyway.
   *
   * ⚠️ The community is NOT here, and the wallet must not read one out of it: an arrival
   * is by construction a member of this community (`RegisterAccount.context` writes the
   * home uuid on the row it creates), so the wallet pairs this with its own community and
   * the server reads a missing one as this community too (`resolveCommunityUuid`).
   */
  @Field()
  gradidoID: string

  @Field()
  alias: string

  /**
   * The circle's colour as a finished palette digit, the same one the contact list and
   * the booking rows carry (NU-017): the backend hashes the real initials and hands out
   * only the result, so the arrival's circle on the tile is the colour that member has
   * everywhere else -- without this side ever learning their name (NU-019).
   *
   * Null where it cannot be worked out, and everything then falls back to the seed path
   * `AppAvatar` uses for members whose names this browser still receives.
   */
  @Field(() => Int, { nullable: true })
  avatarColorIndex: number | null

  /**
   * When this member's picture last changed, or null where they have none to show.
   *
   * ⛔ The DATE, never the picture. It is what the wallet's own picture store is keyed by:
   * a date that matches what the device already holds means nothing has to be fetched, and
   * a null means "no picture" -- which is also how a member who switched theirs off leaves
   * this device. The same shape the booking list and the contact list deliver, and
   * `dbFindMemberAvatarTimestamps` is the one query that answers it, guard included.
   */
  @Field(() => Date, { nullable: true })
  avatarUpdatedAt: Date | null

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

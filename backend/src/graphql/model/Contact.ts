// AI-GENERATED — not an architecture reference
import { ContactOrigin } from '@enum/ContactOrigin'
import { Field, Int, ObjectType } from 'type-graphql'
import { User } from './User'

/**
 * Somebody this member has exchanged Gradido with, once, however many bookings there were.
 *
 * `user` is the same model the booking row carries, so the contact list reads by the same
 * fields -- alias, community, colour digit, avatar date -- and by the same rule: no real
 * name (NU-019). The three numbers come from the same grouping that found the person.
 */
@ObjectType()
export class Contact {
  constructor(
    user: User,
    firstAt: Date,
    lastAt: Date,
    bookings: number,
    favorite: boolean,
    homeCommunity: boolean,
    origin: ContactOrigin | null,
  ) {
    this.user = user
    this.firstAt = firstAt
    this.lastAt = lastAt
    this.bookings = bookings
    this.favorite = favorite
    this.homeCommunity = homeCommunity
    this.origin = origin
  }

  @Field(() => User)
  user: User

  /** When the first booking with them was. */
  @Field(() => Date)
  firstAt: Date

  /** When the latest was -- the list is ordered by this. */
  @Field(() => Date)
  lastAt: Date

  /**
   * How many bookings there were with them, both directions counted.
   *
   * ⚠️ May be 0 since the referral trace became a second source: somebody who came here
   * over this member is a contact from that moment, before anything has been exchanged.
   * Whoever renders this must not reach for a plural rule with a 0 in it, and must not
   * offer a link into a booking list that has nothing in it.
   */
  @Field(() => Int)
  bookings: number

  /** Whether the asking member has given them the heart. */
  @Field(() => Boolean)
  favorite: boolean

  /**
   * Whether this person belongs to the community this server serves.
   *
   * Answered here because only this side can answer it: the wallet knows its own community
   * by a name out of its OWN configuration, while the name on a contact was written from
   * the backend's -- two variables in two deployments, which agree by coincidence and part
   * company silently. The comparison made here is against the home community's uuid, which
   * the resolver loads for the page anyway.
   *
   * What the wallet does with it: a member's Gradido address is `host/u/alias`, and the
   * host is THEIR community's. For somebody in this one it is ours; for anybody else the
   * wallet would have to invent it, and an address that resolves to the wrong person is
   * worse than none.
   */
  @Field(() => Boolean)
  homeCommunity: boolean

  /**
   * What made the two of them contacts where it was not a booking -- null where it was one.
   *
   * A contact arises from a shared event, and the invitation is the second such event
   * (KF-012). The two values are the two directions of one trace, seen from the asking
   * member: REFERRER is whoever showed them Gradido, ARRIVAL whoever came here over them.
   *
   * Nullable rather than a third value for "a booking", because that is not an origin the
   * wallet ever says out loud -- there the line under the name is the number of bookings.
   * A contact can carry both a count and an origin; both lines are then shown.
   *
   * ⛔ And it stays a line on ONE person. No field here counts how many came over this
   * member, and none should be added: a line on one person is a mirror, a sum over them is
   * a score (KF-014, ZE-007). The same decision keeps `ShowFriends` without a count.
   */
  @Field(() => ContactOrigin, { nullable: true })
  origin: ContactOrigin | null
}

// AI-GENERATED — not an architecture reference
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
  ) {
    this.user = user
    this.firstAt = firstAt
    this.lastAt = lastAt
    this.bookings = bookings
    this.favorite = favorite
    this.homeCommunity = homeCommunity
  }

  @Field(() => User)
  user: User

  /** When the first booking with them was. */
  @Field(() => Date)
  firstAt: Date

  /** When the latest was -- the list is ordered by this. */
  @Field(() => Date)
  lastAt: Date

  /** How many bookings there were with them, both directions counted. */
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
}

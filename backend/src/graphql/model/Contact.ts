// AI-GENERATED — not an architecture reference
import { ContactOrigin } from '@enum/ContactOrigin'
import { Field, Int, ObjectType } from 'type-graphql'
import { User } from './User'

/**
 * Somebody this member shares an event with -- a booking, the referral trace or a message --
 * once, however many events there were.
 *
 * `user` is the same model the booking row carries, so the contact list reads by the same
 * fields -- alias, community, colour digit, avatar date -- and by the same rule: no real
 * name (NU-019). The figures come from the same grouping that found the person.
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
    unreadChatMessages: number,
    lastChatMessageAt: Date | null,
  ) {
    this.user = user
    this.firstAt = firstAt
    this.lastAt = lastAt
    this.bookings = bookings
    this.favorite = favorite
    this.homeCommunity = homeCommunity
    this.origin = origin
    this.unreadChatMessages = unreadChatMessages
    this.lastChatMessageAt = lastChatMessageAt
  }

  @Field(() => User)
  user: User

  /**
   * When this contact began: the oldest of three kinds of event -- the first booking with
   * them, the day the referral trace put them beside this member, and the first message
   * between the two (as it arrived here).
   *
   * ⚠️ Not "the first booking" any more. For somebody who came here over this member it is
   * their registration, for somebody they only wrote with it is the first message, and for a
   * contact who is several of these it reaches back past every booking -- which is what
   * "Kontakt seit" means and why the wallet shows it as plain text rather than as a way into
   * the booking list.
   */
  @Field(() => Date)
  firstAt: Date

  /**
   * The latest of those events -- the list is ordered by this, so a contact with a fresh
   * message stands at the top (E-023).
   *
   * Where there is a booking, a registration date is never the latest (an account has to
   * exist before it can book); a message can be, and then this is the time it arrived here,
   * the same as `lastChatMessageAt`.
   */
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

  /**
   * How many messages in the conversation with them the asking member has not read: those
   * above the member's OWN read pointer, written by the other side. 0 where there is no
   * conversation.
   *
   * ⛔ About the asking member only. Nothing on this type says whether the other side has
   * read anything -- their pointer is their own (E-008, invariant 2: no read receipt).
   */
  @Field(() => Int)
  unreadChatMessages: number

  /** When the latest message between the two arrived here; null where there is none. */
  @Field(() => Date, { nullable: true })
  lastChatMessageAt: Date | null
}

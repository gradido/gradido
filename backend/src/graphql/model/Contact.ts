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
  constructor(user: User, firstAt: Date, lastAt: Date, bookings: number, favorite: boolean) {
    this.user = user
    this.firstAt = firstAt
    this.lastAt = lastAt
    this.bookings = bookings
    this.favorite = favorite
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
}

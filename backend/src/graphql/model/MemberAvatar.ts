// AI-GENERATED — not an architecture reference
import { Field, ObjectType } from 'type-graphql'

/**
 * One other member's picture, as it may be shown next to a booking they share with the
 * caller.
 *
 * ⛔ Only members who have something to show appear in an answer at all. There is no entry
 * with a null picture, and that is deliberate: an entry saying "this member, no picture"
 * and no entry at all carry the same information for the wallet, while the first one also
 * confirms that the member exists. A query that answers questions nobody asked is how a
 * picture endpoint quietly becomes a directory.
 *
 * The consequence for the caller is the useful one: everything it asked about and did not
 * get back has nothing to show, for whatever reason -- no picture, switch off, deleted,
 * another community. Those reasons are somebody else's business and stay behind the query.
 */
@ObjectType()
export class MemberAvatar {
  @Field(() => String)
  gradidoID: string

  @Field(() => String, { nullable: true })
  communityUuid: string | null

  /** The small rendition, 128x128, base64 without a data URI prefix. */
  @Field(() => String)
  avatar: string

  /**
   * When this member last changed it. The caller stores it with the picture and keeps the
   * picture while the date still matches what a booking list reports -- which is what
   * makes it possible to ask for pictures once instead of on every visit.
   */
  @Field(() => Date)
  avatarUpdatedAt: Date
}

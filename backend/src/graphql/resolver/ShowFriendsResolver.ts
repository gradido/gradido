// AI-GENERATED — not an architecture reference
import { ShowFriends } from '@model/ShowFriends'
import { dbFindLatestArrival, dbFindMemberAvatarTimestamps, dbFindReferrerAlias } from 'database'
import { Authorized, Ctx, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { avatarColorIndex } from '@/data/AvatarColor.logic'
import { Context, getUser } from '@/server/context'

/**
 * Two readings about the caller and nobody else: who brought them here, and who arrived
 * over them last. It takes no argument on purpose - there is no way to ask this about
 * somebody else, so there is nothing to authorize beyond being signed in.
 */
@Resolver()
export class ShowFriendsResolver {
  @Authorized([RIGHTS.SHOW_FRIENDS])
  @Query(() => ShowFriends)
  async showFriends(@Ctx() context: Context): Promise<ShowFriends> {
    const user = getUser(context)
    const [referrerAlias, arrival] = await Promise.all([
      dbFindReferrerAlias(user.id),
      dbFindLatestArrival(user.id),
    ])
    if (!arrival) {
      return { referrerAlias, latestArrival: null }
    }

    // ⛔ The one query that answers "when did this member's picture last change", guard
    // included: `mayBeShownToMembers` lives inside it, so a member who switched their
    // picture off comes back missing from the map rather than dated. Asked only once an
    // arrival exists -- the caller who has none pays nothing for it.
    const dates = await dbFindMemberAvatarTimestamps([arrival.userId])

    return {
      referrerAlias,
      // Written out rather than spread, and that is now carrying two things. One is the
      // name the two layers spell differently (`gradidoId` in the column, `gradidoID` in
      // the schema -- the same translation `ContactResolver` makes for a contact row).
      // The other is that `arrival` holds the REAL names, and nothing may pass them on:
      // they are hashed into the colour digit here and go no further (NU-019). Spelling
      // every field is what makes both visible at the one place it matters, and it means
      // the compiler names this spot the day `ShowFriendsArrival` gains another field.
      latestArrival: {
        gradidoID: arrival.gradidoId,
        alias: arrival.alias,
        avatarColorIndex: avatarColorIndex(arrival.firstName, arrival.lastName),
        avatarUpdatedAt: dates.get(arrival.userId) ?? null,
        createdAt: arrival.createdAt,
        first: arrival.first,
      },
    }
  }
}

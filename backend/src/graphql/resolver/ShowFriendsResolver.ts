// AI-GENERATED — not an architecture reference
import { ShowFriends } from '@model/ShowFriends'
import { dbFindLatestArrival, dbFindReferrerAlias } from 'database'
import { Authorized, Ctx, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
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
    const [referrerAlias, latestArrival] = await Promise.all([
      dbFindReferrerAlias(user.id),
      dbFindLatestArrival(user.id),
    ])
    return { referrerAlias, latestArrival }
  }
}

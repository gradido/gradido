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
    const [referrerAlias, arrival] = await Promise.all([
      dbFindReferrerAlias(user.id),
      dbFindLatestArrival(user.id),
    ])
    return {
      referrerAlias,
      // Written out rather than spread, for the one name the two layers spell
      // differently: the column is `gradidoId`, the schema `gradidoID` -- the same
      // translation `ContactResolver` makes for a contact row. Spelling every field means
      // the compiler names this place the day `ShowFriendsArrival` gains another one,
      // instead of quietly handing the query a field it will not serialise.
      latestArrival: arrival
        ? {
            gradidoID: arrival.gradidoId,
            alias: arrival.alias,
            createdAt: arrival.createdAt,
            first: arrival.first,
          }
        : null,
    }
  }
}

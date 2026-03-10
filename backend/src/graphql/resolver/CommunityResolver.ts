import { Paginated } from '@arg/Paginated'
import { EditCommunityInput } from '@input/EditCommunityInput'
import { AdminCommunityView } from '@model/AdminCommunityView'
import { Community } from '@model/Community'
import {
  Community as DbCommunity,
  getAuthorizedCommunities,
  getHomeCommunity,
  getReachableCommunities,
} from 'database'
import { updateAllDefinedAndChanged } from 'shared'
import { Arg, Args, Authorized, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { getAllCommunities, getCommunityByIdentifier, getCommunityByUuid } from './util/communities'
import { Location2Point } from './util/Location2Point'

@Resolver()
export class CommunityResolver {
  @Authorized([RIGHTS.COMMUNITY_WITH_API_KEYS])
  @Query(() => [AdminCommunityView])
  async allCommunities(@Args() paginated: Paginated): Promise<AdminCommunityView[]> {
    // communityUUID could be oneTimePassCode (uint32 number)
    return (await getAllCommunities(paginated)).map((dbCom) => new AdminCommunityView(dbCom))
  }

  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => [Community])
  async reachableCommunities(): Promise<Community[]> {
    const dbCommunities: DbCommunity[] = await getReachableCommunities(
      CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER * 2,
      {
        // order by
        foreign: 'ASC', // home community first
        name: 'ASC', // sort foreign communities by name
      },
    )
    return dbCommunities.map((dbCom: DbCommunity) => new Community(dbCom))
  }

  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => [Community])
  async authorizedCommunities(): Promise<Community[]> {
    const dbCommunities: DbCommunity[] = await getAuthorizedCommunities({
      // order by
      foreign: 'ASC', // home community first
      name: 'ASC',
    })
    return dbCommunities.map((dbCom: DbCommunity) => new Community(dbCom))
  }

  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => Community)
  async communityByIdentifier(
    @Arg('communityIdentifier') communityIdentifier: string,
  ): Promise<Community> {
    // communityUUID could be oneTimePassCode (uint32 number)
    const community = await getCommunityByIdentifier(communityIdentifier)
    if (!community) {
      throw new LogError('community not found', communityIdentifier)
    }
    return new Community(community)
  }

  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => Community)
  async homeCommunity(): Promise<Community> {
    const community = await getHomeCommunity()
    if (!community) {
      throw new LogError('no home community exist')
    }
    return new Community(community)
  }

  @Authorized([RIGHTS.COMMUNITY_UPDATE])
  @Mutation(() => AdminCommunityView)
  async updateHomeCommunity(
    @Args() { uuid, gmsApiKey, location, hieroTopicId }: EditCommunityInput,
  ): Promise<AdminCommunityView> {
    const homeCom = await getCommunityByUuid(uuid)
    if (!homeCom) {
      throw new LogError('HomeCommunity with uuid not found: ', uuid)
    }
    if (homeCom.foreign) {
      throw new LogError('Error: Only the HomeCommunity could be modified!')
    }
    let updated = false
    // if location is undefined, it should not be changed
    // if location is null, it should be set to null
    if (typeof location !== 'undefined') {
      const newLocation = location ? Location2Point(location) : null
      if (newLocation !== homeCom.location) {
        homeCom.location = newLocation
        updated = true
      }
    }
    if (updateAllDefinedAndChanged(homeCom, { gmsApiKey, hieroTopicId })) {
      updated = true
    }
    if (updated) {
      await DbCommunity.save(homeCom)
    }
    return new AdminCommunityView(homeCom)
  }
}

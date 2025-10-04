import { 
  Community as DbCommunity, 
  getReachableCommunities, 
  getHomeCommunity 
} from 'database'
import { Arg, Args, Authorized, Mutation, Query, Resolver } from 'type-graphql'

import { Paginated } from '@arg/Paginated'
import { EditCommunityInput } from '@input/EditCommunityInput'
import { AdminCommunityView } from '@model/AdminCommunityView'
import { Community } from '@model/Community'

import { RIGHTS } from '@/auth/RIGHTS'
import { LogError } from '@/server/LogError'

import { Location2Point } from './util/Location2Point'
import {
  getAllCommunities,
  getCommunityByIdentifier,
  getCommunityByUuid,
} from './util/communities'

import { CONFIG } from '@/config'

@Resolver()
export class CommunityResolver {
<<<<<<< HEAD
=======
  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => [FederatedCommunity])
  async getCommunities(): Promise<FederatedCommunity[]> {
    const dbFederatedCommunities: DbFederatedCommunity[] = await DbFederatedCommunity.find({
      order: {
        foreign: 'ASC',
        createdAt: 'DESC',
        lastAnnouncedAt: 'DESC',
      },
    })
    return dbFederatedCommunities.map(
      (dbCom: DbFederatedCommunity) => new FederatedCommunity(dbCom),
    )
  }

>>>>>>> refactor_community_auth
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
      CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER * 2, {
        // order by 
        foreign: 'ASC', // home community first
        name: 'ASC', // sort foreign communities by name
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
        
    if (
      homeCom.gmsApiKey !== gmsApiKey ||
      homeCom.location !== location ||
      homeCom.hieroTopicId !== hieroTopicId
    ) {
      // TODO: think about this, it is really expected to delete gmsApiKey if no new one is given?
      homeCom.gmsApiKey = gmsApiKey ?? null
      if (location) {
        homeCom.location = Location2Point(location)
      }
      // update only with new value, don't overwrite existing value with null or undefined!
      if (hieroTopicId) {
        homeCom.hieroTopicId = hieroTopicId
      }
      await DbCommunity.save(homeCom)
    }
<<<<<<< HEAD
    
=======
>>>>>>> refactor_community_auth
    return new AdminCommunityView(homeCom)
  }
}

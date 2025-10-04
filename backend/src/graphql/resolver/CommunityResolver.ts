import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity, getHomeCommunity } from 'database'
import { Arg, Args, Authorized, Mutation, Query, Resolver } from 'type-graphql'
import { IsNull, Not, Point } from 'typeorm'

import { Paginated } from '@arg/Paginated'
import { EditCommunityInput } from '@input/EditCommunityInput'
import { AdminCommunityView } from '@model/AdminCommunityView'
import { Community } from '@model/Community'
import { FederatedCommunity } from '@model/FederatedCommunity'

import { RIGHTS } from '@/auth/RIGHTS'
import { LogError } from '@/server/LogError'

import { Location2Point } from './util/Location2Point'
import {
  getAllCommunities,
  getCommunityByIdentifier,
  getCommunityByUuid,
} from './util/communities'
import { updateAllDefinedAndChanged } from 'shared'

@Resolver()
export class CommunityResolver {
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

  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => [AdminCommunityView])
  async allCommunities(@Args() paginated: Paginated): Promise<AdminCommunityView[]> {
    // communityUUID could be oneTimePassCode (uint32 number)
    return (await getAllCommunities(paginated)).map((dbCom) => new AdminCommunityView(dbCom))
  }

  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => [Community])
  async communities(): Promise<Community[]> {
    const dbCommunities: DbCommunity[] = await DbCommunity.find({
      where: { communityUuid: Not(IsNull()) }, //, authenticatedAt: Not(IsNull()) },
      order: {
        name: 'ASC',
      },
    })
    return dbCommunities.map((dbCom: DbCommunity) => new Community(dbCom))
  }

  @Authorized([RIGHTS.COMMUNITY_BY_IDENTIFIER])
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

  @Authorized([RIGHTS.HOME_COMMUNITY])
  @Query(() => Community)
  async homeCommunity(): Promise<Community> {
    const community = await getHomeCommunity()
    if (!community) {
      throw new LogError('no home community exist')
    }
    return new Community(community)
  }

  @Authorized([RIGHTS.COMMUNITY_UPDATE])
  @Mutation(() => Community)
  async updateHomeCommunity(
    @Args() { uuid, gmsApiKey, location, hieroTopicId }: EditCommunityInput,
  ): Promise<Community> {
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
    return new Community(homeCom)
  }
}

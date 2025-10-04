import { Community as DbCommunity, FederatedCommunity as DbFederatedCommunity, getHomeCommunity } from 'database'
import { Arg, Args, Authorized, Mutation, Query, Resolver } from 'type-graphql'
import { IsNull, Not } from 'typeorm'

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

  @Authorized([RIGHTS.COMMUNITY_WITH_API_KEYS])
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
      homeCom.gmsApiKey = gmsApiKey ?? null
      if (location) {
        homeCom.location = Location2Point(location)
      }
      homeCom.hieroTopicId = hieroTopicId ?? null
      await DbCommunity.save(homeCom)
    }
    return new AdminCommunityView(homeCom)
  }
}

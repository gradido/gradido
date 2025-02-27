import { IsNull, Not } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { Resolver, Query, Authorized, Mutation, Args, Arg } from 'type-graphql'

import { Paginated } from '@arg/Paginated'
import { EditCommunityInput } from '@input/EditCommunityInput'
import { AdminCommunityView } from '@model/AdminCommunityView'
import { Community } from '@model/Community'
import { FederatedCommunity } from '@model/FederatedCommunity'

import { RIGHTS } from '@/auth/RIGHTS'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import {
  getAllCommunities,
  getCommunityByIdentifier,
  getCommunityByUuid,
  getHomeCommunity,
} from './util/communities'
import { Location2Point } from './util/Location2Point'

@Resolver()
export class CommunityResolver {
  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => [FederatedCommunity])
  async getCommunities(): Promise<FederatedCommunity[]> {
    logger.debug('getCommunities...')
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
    logger.debug('allCommunities...')
    return (await getAllCommunities(paginated)).map((dbCom) => new AdminCommunityView(dbCom))
  }

  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => [Community])
  async communities(): Promise<Community[]> {
    logger.info('communities...')
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
    logger.debug('communityByIdentifier...')
    const community = await getCommunityByIdentifier(communityIdentifier)
    if (!community) {
      throw new LogError('community not found', communityIdentifier)
    }
    return new Community(community)
  }

  @Authorized([RIGHTS.HOME_COMMUNITY])
  @Query(() => Community)
  async homeCommunity(): Promise<Community> {
    logger.debug('homeCommunity...')
    const community = await getHomeCommunity()
    if (!community) {
      throw new LogError('no home community exist')
    }
    return new Community(community)
  }

  @Authorized([RIGHTS.COMMUNITY_UPDATE])
  @Mutation(() => Community)
  async updateHomeCommunity(
    @Args() { uuid, gmsApiKey, location }: EditCommunityInput,
  ): Promise<Community> {
    logger.debug('updateHomeCommunity...location:', location)
    const homeCom = await getCommunityByUuid(uuid)
    if (!homeCom) {
      throw new LogError('HomeCommunity with uuid not found: ', uuid)
    }
    if (homeCom.foreign) {
      throw new LogError('Error: Only the HomeCommunity could be modified!')
    }
    if (homeCom.gmsApiKey !== gmsApiKey || homeCom.location !== location) {
      homeCom.gmsApiKey = gmsApiKey ?? null
      if (location) {
        homeCom.location = Location2Point(location)
      }
      await DbCommunity.save(homeCom)
    }
    return new Community(homeCom)
  }
}

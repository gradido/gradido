import { IsNull, Not } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { Resolver, Query, Authorized, Mutation, Args } from 'type-graphql'

import { CommunityArgs } from '@arg//CommunityArgs'
import { EditCommunityInput } from '@input/EditCommunityInput'
import { Community } from '@model/Community'
import { FederatedCommunity } from '@model/FederatedCommunity'

import { RIGHTS } from '@/auth/RIGHTS'
import { LogError } from '@/server/LogError'

import { getCommunity } from './util/communities'

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
  async community(@Args() communityArgs: CommunityArgs): Promise<Community> {
    const community = await getCommunity(communityArgs)
    if (!community) {
      throw new LogError('community not found', communityArgs)
    }
    return new Community(community)
  }

  @Authorized([RIGHTS.COMMUNITY_UPDATE])
  @Mutation(() => Community)
  async updateHomeCommunity(@Args() { uuid, gmsApiKey }: EditCommunityInput): Promise<Community> {
    const homeCom = await getCommunity({ communityIdentifier: uuid })
    if (!homeCom) {
      throw new LogError('HomeCommunity with uuid not found: ', uuid)
    }
    if (homeCom.foreign) {
      throw new LogError('Error: Only the HomeCommunity could be modified!')
    }
    if (homeCom.gmsApiKey !== gmsApiKey) {
      homeCom.gmsApiKey = gmsApiKey
      await DbCommunity.save(homeCom)
    }
    return new Community(homeCom)
  }
}

import { IsNull, Not } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { Resolver, Query, Authorized, Arg, Mutation, Args } from 'type-graphql'

import { CommunityArgs } from '@arg//CommunityArgs'
import { Paginated } from '@arg/Paginated'
import { AdminCommunityView } from '@model/AdminCommunityView'
import { Community } from '@model/Community'
import { FederatedCommunity } from '@model/FederatedCommunity'

import { RIGHTS } from '@/auth/RIGHTS'
import { LogError } from '@/server/LogError'

import { getAllCommunities, getCommunityByUuid } from './util/communities'

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

  @Authorized([RIGHTS.COMMUNITY_BY_UUID])
  @Query(() => Community)
  async community(@Arg('communityUuid') communityUuid: string): Promise<Community> {
    const com: DbCommunity | null = await getCommunityByUuid(communityUuid)
    if (!com) {
      throw new LogError('community not found', communityUuid)
    }
    return new Community(com)
  }

  @Authorized([RIGHTS.COMMUNITY_UPDATE])
  @Mutation(() => Community)
  async updateHomeCommunity(@Args() { uuid, gmsApiKey }: CommunityArgs): Promise<Community> {
    let homeCom: DbCommunity | null
    let com: Community
    if (uuid) {
      let toUpdate = false
      homeCom = await getCommunityByUuid(uuid)
      if (!homeCom) {
        throw new LogError('HomeCommunity with uuid not found: ', uuid)
      }
      if (homeCom.foreign) {
        throw new LogError('Error: Only the HomeCommunity could be modified!')
      }
      if (homeCom.gmsApiKey !== gmsApiKey) {
        homeCom.gmsApiKey = gmsApiKey
        toUpdate = true
      }
      if (toUpdate) {
        await DbCommunity.save(homeCom)
      }
      com = new Community(homeCom)
    } else {
      throw new LogError(`HomeCommunity without an uuid can't be modified!`)
    }
    return com
  }
}

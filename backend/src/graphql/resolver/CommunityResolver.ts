import { FindOptionsWhere, IsNull, Not } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { Resolver, Query, Authorized, Arg, Args } from 'type-graphql'

import { Community } from '@model/Community'
import { FederatedCommunity } from '@model/FederatedCommunity'

import { RIGHTS } from '@/auth/RIGHTS'
import { CommunityArgs } from '@/graphql/arg/CommunityArgs'

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
  @Query(() => Community)
  async community(@Args() { foreign, communityUuid }: CommunityArgs): Promise<Community> {
    const where: FindOptionsWhere<DbCommunity> = {}
    if (foreign !== null && foreign !== undefined) {
      where.foreign = foreign
    }
    if (communityUuid) {
      where.communityUuid = communityUuid
    }
    const community = await DbCommunity.findOneOrFail({ where })
    return new Community(community)
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
}

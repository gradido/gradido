import { Resolver, Query, Authorized } from 'type-graphql'

import { Community } from '@model/Community'
import { Community as DbCommunity } from '@entity/Community'

import { RIGHTS } from '@/auth/RIGHTS'

@Resolver()
export class CommunityResolver {
  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => [Community])
  async getCommunities(): Promise<Community[]> {
    const comList: Community[] = []
    const dbCommunities: DbCommunity[] = await DbCommunity.find({ order: { id: 'ASC' } })
    dbCommunities.forEach(async function (dbCom) {
      const com = new Community(dbCom)
      comList.push(com)
    })
    return comList
  }
}

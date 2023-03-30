import { Community as DbCommunity } from '@entity/Community'
import { Resolver, Query, Authorized } from 'type-graphql'

import { RIGHTS } from '@/auth/RIGHTS'
import { Community } from '@model/Community'

@Resolver()
export class CommunityResolver {
  @Authorized([RIGHTS.COMMUNITIES])
  @Query(() => [Community])
  async getCommunities(): Promise<Community[]> {
    const dbCommunities: DbCommunity[] = await DbCommunity.find({
      order: { foreign: 'ASC', publicKey: 'ASC', apiVersion: 'ASC' },
    })
    return dbCommunities.map((dbCom: DbCommunity) => new Community(dbCom))
  }
}

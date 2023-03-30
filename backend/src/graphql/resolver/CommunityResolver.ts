import { Resolver, Query, Authorized } from 'type-graphql'
import { Community as DbCommunity } from '@entity/Community'

import { Community } from '@model/Community'
import { RIGHTS } from '@/auth/RIGHTS'

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Query, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from '@entity/Community'
import { GetPublicCommunityInfoResult } from '../model/GetPublicCommunityInfoResult'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PublicCommunityInfoResolver {
  @Query(() => GetPublicCommunityInfoResult)
  async getPublicCommunityInfo(): Promise<GetPublicCommunityInfoResult> {
    logger.debug(`getPublicCommunityInfo() via apiVersion=1_0 ...`)
    const homeCom = await DbCommunity.findOneOrFail({ foreign: false })
    const result = new GetPublicCommunityInfoResult(homeCom)
    logger.info(
      `getPublicCommunityInfo()-1_0... return publicInfo=${JSON.stringify(
        result
      )}`
    )
    return result
  }
}

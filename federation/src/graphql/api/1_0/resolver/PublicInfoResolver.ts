// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Query, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from '@entity/Community'
import { GetPublicInfoResult } from '../model/GetPublicInfoResult'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PublicInfoResolver {
  @Query(() => GetPublicInfoResult)
  async getPublicInfo(): Promise<GetPublicInfoResult> {
    logger.debug(`getPublicInfo() via apiVersion=1_0 ...`)
    const homeCom = await DbCommunity.findOneOrFail({ foreign: false })
    const result = new GetPublicInfoResult(homeCom)
    logger.info(`getPublicInfo()-1_0... return publicInfo=${result}`)
    return result
  }
}

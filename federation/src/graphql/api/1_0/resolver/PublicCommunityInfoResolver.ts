import { Community as DbCommunity } from 'database'
import { getLogger } from 'log4js'
import { Query, Resolver } from 'type-graphql'
import { LOG4JS_RESOLVER_1_0_CATEGORY_NAME } from '.'
import { GetPublicCommunityInfoResultLoggingView } from '../logger/GetPublicCommunityInfoResultLogging.view'
import { GetPublicCommunityInfoResult } from '../model/GetPublicCommunityInfoResult'

const logger = getLogger(`${LOG4JS_RESOLVER_1_0_CATEGORY_NAME}.PublicCommunityInfoResolver`)

@Resolver()
export class PublicCommunityInfoResolver {
  @Query(() => GetPublicCommunityInfoResult)
  async getPublicCommunityInfo(): Promise<GetPublicCommunityInfoResult> {
    logger.debug(`getPublicCommunityInfo() via apiVersion=1_0 ...`)
    const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
    const result = new GetPublicCommunityInfoResult(homeCom)
    const publicInfoView = new GetPublicCommunityInfoResultLoggingView(result)
    logger.debug(
      `getPublicCommunityInfo()-1_0... return publicInfo=${publicInfoView.toString(true)}`,
    )
    return result
  }
}

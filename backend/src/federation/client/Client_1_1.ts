import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

import { getPublicCommunityInfo } from '@/federation/query/getPublicCommunityInfo'
import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line camelcase
import { Client_1_0 } from './Client_1_0'

export interface PublicCommunityInfo {
  name: string
  description: string
  createdAt: Date
  publicKey: string
}

// eslint-disable-next-line camelcase
export class Client_1_1 extends Client_1_0 {
  constructor(dbCom: DbFederatedCommunity) {
    super(dbCom)
  }

  getPublicCommunityInfo = async (): Promise<PublicCommunityInfo | undefined> => {
    logger.info(`getPublicCommunityInfo with endpoint='${this.endpoint}'...`)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(getPublicCommunityInfo, {})
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.getPublicCommunityInfo?.name) {
        logger.warn(
          'Federation: getPublicCommunityInfo without response data from endpoint',
          this.endpoint,
        )
        return
      }
      logger.info(
        'Federation: getPublicCommunityInfo successful from endpoint',
        this.endpoint,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        data.getPublicCommunityInfo,
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return data.getPublicCommunityInfo
    } catch (err) {
      logger.warn('Federation: getPublicCommunityInfo failed for endpoint', this.endpoint)
    }
  }
}

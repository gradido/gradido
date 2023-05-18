import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLClient } from 'graphql-request'

import { getPublicKey } from '@/federation/query/getPublicKey.2.0'
import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line camelcase
export class Client_2_0 {
  dbCom: DbFederatedCommunity
  endpoint: string
  client: GraphQLClient

  constructor(dbCom: DbFederatedCommunity) {
    this.dbCom = dbCom
    this.endpoint = `${dbCom.endPoint.endsWith('/') ? dbCom.endPoint : dbCom.endPoint + '/'}${
      dbCom.apiVersion
    }/`
    this.client = new GraphQLClient(this.endpoint, {
      method: 'GET',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    })
  }

  getPublicKey = async (): Promise<string | undefined> => {
    logger.info('Federation: getPublicKey from endpoint', this.endpoint)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(getPublicKey, {})
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.getPublicKey) {
        logger.warn('Federation: getPublicKey without response data from endpoint', this.endpoint)
        return
      }
      logger.info(
        'Federation: getPublicKey successful from endpoint',
        this.endpoint,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        data.getPublicKey,
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return data.getPublicKey
    } catch (err) {
      logger.warn('Federation: getPublicKey failed for endpoint', this.endpoint)
    }
  }
}

import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLClient } from 'graphql-request'

import { backendLogger as logger } from '@/server/logger'

import { OpenConnectionArgs } from './model/OpenConnectionArgs'
import { openConnection } from './query/openConnection'

export class AuthenticationClient {
  dbCom: DbFederatedCommunity
  endpoint: string
  client: GraphQLClient

  constructor(dbCom: DbFederatedCommunity) {
    this.dbCom = dbCom
    this.endpoint = `${dbCom.endPoint.endsWith('/') ? dbCom.endPoint : dbCom.endPoint + '/'}${
      dbCom.apiVersion
    }/`
    this.client = new GraphQLClient(this.endpoint, {
      method: 'POST',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    })
  }

  async openConnection(args: OpenConnectionArgs): Promise<boolean | undefined> {
    logger.debug(`Authentication: openConnection at ${this.endpoint} for args:`, args)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(openConnection, { args })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.openConnection) {
        logger.warn(
          'Authentication: openConnection without response data from endpoint',
          this.endpoint,
        )
        return false
      }
      logger.debug(
        'Authentication: openConnection successfully started with endpoint',
        this.endpoint,
      )
      return true
    } catch (err) {
      logger.error('Authentication: error on openConnection', err)
    }
  }
}

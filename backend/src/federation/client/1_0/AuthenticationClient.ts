import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'

import { ensureUrlEndsWithSlash } from '@/util/utilities'

import { LOG4JS_FEDERATION_CLIENT1_0_CATEGORY_NAME } from '@/federation/client/1_0'
import { getLogger } from 'log4js'
import { OpenConnectionArgs } from './model/OpenConnectionArgs'
import { openConnection } from './query/openConnection'

const logger = getLogger(`${LOG4JS_FEDERATION_CLIENT1_0_CATEGORY_NAME}.AuthenticationClient`)

export class AuthenticationClient {
  dbCom: DbFederatedCommunity
  endpoint: string
  client: GraphQLClient

  constructor(dbCom: DbFederatedCommunity) {
    this.dbCom = dbCom
    this.endpoint = ensureUrlEndsWithSlash(dbCom.endPoint).concat(dbCom.apiVersion).concat('/')
    this.client = new GraphQLClient(this.endpoint, {
      method: 'POST',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    })
  }

  async openConnection(args: OpenConnectionArgs): Promise<boolean | undefined> {
    logger.debug(`openConnection at ${this.endpoint} for args:`, args)
    try {
      const { data } = await this.client.rawRequest<{ openConnection: boolean }>(openConnection, {
        args,
      })
      if (!data?.openConnection) {
        logger.warn('openConnection without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug('openConnection successfully started with endpoint', this.endpoint)
      return true
    } catch (err) {
      logger.error('error on openConnection: ', err)
    }
  }
}

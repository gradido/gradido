import { EncryptedTransferArgs, ensureUrlEndsWithSlash } from 'core'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { openConnection } from './query/openConnection'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.client.1_0.AuthenticationClient`)

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

  async openConnection(args: EncryptedTransferArgs): Promise<boolean | undefined> {
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

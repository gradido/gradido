import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

import { EncryptedTransferArgs } from 'core/src/graphql/model/EncryptedTransferArgs'
import { authenticate } from './query/authenticate'
import { openConnectionCallback } from './query/openConnectionCallback'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.client.1_0.AuthenticationClient`)

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

  async openConnectionCallback(args: EncryptedTransferArgs): Promise<boolean> {
    logger.addContext('handshakeID', args.handshakeID)
    logger.debug('openConnectionCallback with endpoint', this.endpoint, args)
    try {
      const { data } = await this.client.rawRequest<any>(openConnectionCallback, { args })
      logger.debug('after openConnectionCallback: data:', data)

      if (!data || !data.openConnectionCallback) {
        logger.warn('openConnectionCallback without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug('openConnectionCallback successfully started with endpoint', this.endpoint)
      return true
    } catch (err) {
      logger.error('error on openConnectionCallback', err)
    }
    return false
  }

  async authenticate(args: EncryptedTransferArgs): Promise<string | null> {
    logger.addContext('handshakeID', args.handshakeID)
    logger.debug('authenticate with endpoint=', this.endpoint)
    try {
      const { data } = await this.client.rawRequest<any>(authenticate, { args })
      logger.debug('after authenticate: data:', data)

      const authUuid: string = data?.authenticate
      if (authUuid) {
        logger.debug('received authenticated uuid', authUuid)
        return authUuid
      }
    } catch (err) {
      logger.error('authenticate failed', {
        endpoint: this.endpoint,
        err,
      })
    }
    return null
  }
}

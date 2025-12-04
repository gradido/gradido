import { EncryptedTransferArgs } from 'core'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'
import { getLogger, Logger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { authenticate } from './query/authenticate'
import { openConnectionCallback } from './query/openConnectionCallback'

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
    const methodLogger = getLogger(
      `${LOG4JS_BASE_CATEGORY_NAME}.client.1_0.AuthenticationClient.openConnectionCallback`,
    )
    methodLogger.addContext('handshakeID', args.handshakeID)
    methodLogger.debug('openConnectionCallback with endpoint', this.endpoint, args)
    try {
      const { data } = await this.client.rawRequest<{ openConnectionCallback: boolean }>(
        openConnectionCallback,
        { args },
      )
      methodLogger.debug('after openConnectionCallback: data:', data)

      if (!data || !data.openConnectionCallback) {
        methodLogger.warn(
          'openConnectionCallback without response data from endpoint',
          this.endpoint,
        )
        return false
      }
      methodLogger.debug('openConnectionCallback successfully started with endpoint', this.endpoint)
      return true
    } catch (err) {
      methodLogger.error('error on openConnectionCallback', err)
    }
    return false
  }

  async authenticate(args: EncryptedTransferArgs): Promise<string | null> {
    const methodLogger = getLogger(
      `${LOG4JS_BASE_CATEGORY_NAME}.client.1_0.AuthenticationClient.authenticate`,
    )
    methodLogger.addContext('handshakeID', args.handshakeID)
    methodLogger.debug('authenticate with endpoint=', this.endpoint)
    try {
      const { data } = await this.client.rawRequest<{ authenticate: string }>(authenticate, {
        args,
      })
      methodLogger.debug('after authenticate: data:', data)

      const responseJwt = data?.authenticate
      if (responseJwt) {
        methodLogger.debug('received authenticated uuid as jwt', responseJwt)
        return responseJwt
      }
    } catch (err) {
      methodLogger.error('authenticate failed', {
        endpoint: this.endpoint,
        err,
      })
    }
    return null
  }
}

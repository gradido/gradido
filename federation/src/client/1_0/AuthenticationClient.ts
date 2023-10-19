import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLClient } from 'graphql-request'
import { federationLogger as logger } from '@/server/logger'

import { OpenConnectionCallbackArgs } from '@/graphql/api/1_0/model/OpenConnectionCallbackArgs'
import { openConnectionCallback } from './query/openConnectionCallback'
import { AuthenticationArgs } from '@/graphql/api/1_0/model/AuthenticationArgs'
import { authenticate } from './query/authenticate'


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
      method: 'GET',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    })
  }

  async openConnectionCallback(args: OpenConnectionCallbackArgs): Promise<boolean | undefined> {
    logger.debug('Authentication: openConnectionCallback with endpoint', this.endpoint, args)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(openConnectionCallback, { args })
      if (!data?.openConnectionCallback) {
        logger.warn(
          'Authentication: openConnectionCallback without response data from endpoint',
          this.endpoint,
        )
        return false
      }
      logger.debug(
        'Authentication: openConnectionCallback successfully started with endpoint',
        this.endpoint,
      )
      return true
    } catch (err) {
      logger.error('Authentication: error on openConnectionCallback', err)
    }
  }

  async authenticate(args: AuthenticationArgs): Promise<string | undefined> {
    logger.debug('Authentication: authenticate with endpoint=', this.endpoint)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(authenticate, {})
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.authenticate) {
        logger.warn(
          'Authentication: authenticate without response data from endpoint',
          this.endpoint,
        )
        return
      }
      const 
    } catch (err) {
      logger.error('Authentication: authenticate  failed for endpoint', this.endpoint)
    }
  }
}

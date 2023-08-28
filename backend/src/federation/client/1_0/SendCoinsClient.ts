import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLClient } from 'graphql-request'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { SendCoinsArgs } from './model/SendCoinsArgs'
import { revertSendCoins } from './query/revertSendCoins'
import { voteForSendCoins } from './query/voteForSendCoins'
import { settleSendCoins } from './query/settleSendCoins'

// eslint-disable-next-line camelcase
export class SendCoinsClient {
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

  voteForSendCoins = async (args: SendCoinsArgs): Promise<string | undefined> => {
    logger.debug('X-Com: voteForSendCoins against endpoint=', this.endpoint)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(voteForSendCoins, { args })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.voteForSendCoins?.voteForSendCoins) {
        logger.warn(
          'X-Com: voteForSendCoins failed with: ',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          data.voteForSendCoins.voteForSendCoins,
        )
        return
      }
      logger.debug(
        'X-Com: voteForSendCoins successful with result=',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        data.voteForSendCoins,
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return data.voteForSendCoins.voteForSendCoins
    } catch (err) {
      throw new LogError(`X-Com: voteForSendCoins failed for endpoint=${this.endpoint}:`, err)
    }
  }

  revertSendCoins = async (args: SendCoinsArgs): Promise<boolean> => {
    logger.debug('X-Com: revertSendCoins against endpoint=', this.endpoint)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(revertSendCoins, { args })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.revertSendCoins?.revertSendCoins) {
        logger.warn('X-Com: revertSendCoins without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug(`X-Com: revertSendCoins successful from endpoint=${this.endpoint}`)
      return true
    } catch (err) {
      logger.error(`X-Com: revertSendCoins failed for endpoint=${this.endpoint}`, err)
      return false
    }
  }

  settleSendCoins = async (args: SendCoinsArgs): Promise<boolean> => {
    logger.debug(`X-Com: settleSendCoins against endpoint='${this.endpoint}'...`)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(settleSendCoins, { args })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.commitSendCoins?.acknowledged) {
        logger.warn('X-Com: settleSendCoins without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug(`X-Com: settleSendCoins successful from endpoint=${this.endpoint}`)
      return true
    } catch (err) {
      throw new LogError(`X-Com: settleSendCoins failed for endpoint=${this.endpoint}`, err)
    }
  }
}

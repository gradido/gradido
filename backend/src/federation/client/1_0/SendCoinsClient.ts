import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLClient } from 'graphql-request'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { SendCoinsArgs } from './model/SendCoinsArgs'
import { SendCoinsResult } from './model/SendCoinsResult'
import { revertSendCoins } from './query/revertSendCoins'
import { revertSettledSendCoins } from './query/revertSettledSendCoins'
import { settleSendCoins } from './query/settleSendCoins'
import { voteForSendCoins } from './query/voteForSendCoins'

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

  voteForSendCoins = async (args: SendCoinsArgs): Promise<SendCoinsResult> => {
    logger.debug('X-Com: voteForSendCoins against endpoint=', this.endpoint)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(voteForSendCoins, { args })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.voteForSendCoins?.vote) {
        logger.warn(
          'X-Com: voteForSendCoins failed with: ',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          data.voteForSendCoins.recipGradidoID,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          data.voteForSendCoins.recipName,
        )
        return new SendCoinsResult()
      }
      const result = new SendCoinsResult()
      result.vote = true
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      result.recipGradidoID = data.voteForSendCoins.recipGradidoID
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      result.recipName = data.voteForSendCoins.recipName
      logger.debug('X-Com: voteForSendCoins successful with result=', result)
      return result
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
      if (!data?.settleSendCoins?.acknowledged) {
        logger.warn('X-Com: settleSendCoins without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug(`X-Com: settleSendCoins successful from endpoint=${this.endpoint}`)
      return true
    } catch (err) {
      throw new LogError(`X-Com: settleSendCoins failed for endpoint=${this.endpoint}`, err)
    }
  }

  revertSettledSendCoins = async (args: SendCoinsArgs): Promise<boolean> => {
    logger.debug(`X-Com: revertSettledSendCoins against endpoint='${this.endpoint}'...`)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(revertSettledSendCoins, { args })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.revertSettledSendCoins?.acknowledged) {
        logger.warn(
          'X-Com: revertSettledSendCoins without response data from endpoint',
          this.endpoint,
        )
        return false
      }
      logger.debug(`X-Com: revertSettledSendCoins successful from endpoint=${this.endpoint}`)
      return true
    } catch (err) {
      throw new LogError(`X-Com: revertSettledSendCoins failed for endpoint=${this.endpoint}`, err)
    }
  }
}

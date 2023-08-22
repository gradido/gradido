import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLClient } from 'graphql-request'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

import { SendCoinsArgs } from './model/SendCoinsArgs'
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

  voteForSendCoins = async (args: SendCoinsArgs): Promise<boolean> => {
    logger.debug('X-Com: voteForSendCoins against endpoint', this.endpoint)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(voteForSendCoins, { args })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.voteForSendCoins?.vote) {
        logger.warn('X-Com: voteForSendCoins without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug(
        'X-Com: voteForSendCoins successful from endpoint',
        this.endpoint,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        data.voteForSendCoins.vote,
      )
      return true
    } catch (err) {
      throw new LogError(`X-Com: voteForSendCoins failed for endpoint=${this.endpoint}:`, err)
    }
  }

  /*
  revertSendCoins = async (args: SendCoinsArgs): Promise<boolean> => {
    logger.debug(`X-Com: revertSendCoins against endpoint='${this.endpoint}'...`)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(revertSendCoins, { args })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.revertSendCoins?.acknowledged) {
        logger.warn('X-Com: revertSendCoins without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug(`X-Com: revertSendCoins successful from endpoint=${this.endpoint}`)
      return true
    } catch (err) {
      throw new LogError(`X-Com: revertSendCoins failed for endpoint=${this.endpoint}`, err)
    }
  }

  commitSendCoins = async (args: SendCoinsArgs): Promise<boolean> => {
    logger.debug(`X-Com: commitSendCoins against endpoint='${this.endpoint}'...`)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.client.rawRequest(commitSendCoins, { args })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.commitSendCoins?.acknowledged) {
        logger.warn('X-Com: commitSendCoins without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug(`X-Com: commitSendCoins successful from endpoint=${this.endpoint}`)
      return true
    } catch (err) {
      throw new LogError(`X-Com: commitSendCoins failed for endpoint=${this.endpoint}`, err)
    }
  }
  */
}

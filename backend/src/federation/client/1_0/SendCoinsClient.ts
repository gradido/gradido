import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'

import { LogError } from '@/server/LogError'
import { ensureUrlEndsWithSlash } from '@/util/utilities'
import { getLogger } from 'log4js'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { SendCoinsArgsLoggingView } from './logging/SendCoinsArgsLogging.view'
import { SendCoinsResultLoggingView } from './logging/SendCoinsResultLogging.view'
import { SendCoinsArgs } from './model/SendCoinsArgs'
import { SendCoinsResult } from './model/SendCoinsResult'
import { revertSendCoins as revertSendCoinsQuery } from './query/revertSendCoins'
import { revertSettledSendCoins as revertSettledSendCoinsQuery } from './query/revertSettledSendCoins'
import { settleSendCoins as settleSendCoinsQuery } from './query/settleSendCoins'
import { voteForSendCoins as voteForSendCoinsQuery } from './query/voteForSendCoins'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.client.1_0.SendCoinsClient`)

export class SendCoinsClient {
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

  async voteForSendCoins(args: SendCoinsArgs): Promise<SendCoinsResult> {
    logger.debug('voteForSendCoins against endpoint=', this.endpoint)
    try {
      logger.debug(`voteForSendCoins with args=`, new SendCoinsArgsLoggingView(args))
      const { data } = await this.client.rawRequest<{ voteForSendCoins: SendCoinsResult }>(
        voteForSendCoinsQuery,
        { args },
      )
      const result = data.voteForSendCoins
      if (!data?.voteForSendCoins?.vote) {
        logger.debug('voteForSendCoins failed with: ', new SendCoinsResultLoggingView(result))
        return new SendCoinsResult()
      }
      logger.debug(
        'voteForSendCoins successful with result=',
        new SendCoinsResultLoggingView(result),
      )
      return result
    } catch (err) {
      throw new LogError(`voteForSendCoins failed for endpoint=${this.endpoint}:`, err)
    }
  }

  async revertSendCoins(args: SendCoinsArgs): Promise<boolean> {
    logger.debug('revertSendCoins against endpoint=', this.endpoint)
    try {
      logger.debug(`revertSendCoins with args=`, new SendCoinsArgsLoggingView(args))
      const { data } = await this.client.rawRequest<{ revertSendCoins: boolean }>(
        revertSendCoinsQuery,
        { args },
      )
      logger.debug(`after revertSendCoins: data=`, data)
      if (!data?.revertSendCoins) {
        logger.warn('revertSendCoins without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug(`revertSendCoins successful from endpoint=${this.endpoint}`)
      return true
    } catch (err) {
      logger.error(`revertSendCoins failed for endpoint=${this.endpoint}`, err)
      return false
    }
  }

  async settleSendCoins(args: SendCoinsArgs): Promise<boolean> {
    logger.debug(`settleSendCoins against endpoint='${this.endpoint}'...`)
    try {
      logger.debug(`settleSendCoins with args=`, new SendCoinsArgsLoggingView(args))
      const { data } = await this.client.rawRequest<{ settleSendCoins: boolean }>(
        settleSendCoinsQuery,
        { args },
      )
      logger.debug(`after settleSendCoins: data=`, data)
      if (!data?.settleSendCoins) {
        logger.warn('settleSendCoins without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug(`settleSendCoins successful from endpoint=${this.endpoint}`)
      return true
    } catch (err) {
      throw new LogError(`settleSendCoins failed for endpoint=${this.endpoint}`, err)
    }
  }

  async revertSettledSendCoins(args: SendCoinsArgs): Promise<boolean> {
    logger.debug(`revertSettledSendCoins against endpoint='${this.endpoint}'...`)
    try {
      logger.debug(`revertSettledSendCoins with args=`, new SendCoinsArgsLoggingView(args))
      const { data } = await this.client.rawRequest<{ revertSettledSendCoins: boolean }>(
        revertSettledSendCoinsQuery,
        { args },
      )
      logger.debug(`after revertSettledSendCoins: data=`, data)

      if (!data?.revertSettledSendCoins) {
        logger.warn('revertSettledSendCoins without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug(`revertSettledSendCoins successful from endpoint=${this.endpoint}`)
      return true
    } catch (err) {
      throw new LogError(`revertSettledSendCoins failed for endpoint=${this.endpoint}`, err)
    }
  }
}

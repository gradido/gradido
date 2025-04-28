import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'
import { ensureUrlEndsWithSlash } from '@/util/utilities'

import { SendCoinsArgsLoggingView } from './logging/SendCoinsArgsLogging.view'
import { SendCoinsResultLoggingView } from './logging/SendCoinsResultLogging.view'
import { SendCoinsArgs } from './model/SendCoinsArgs'
import { SendCoinsResult } from './model/SendCoinsResult'
import { revertSendCoins as revertSendCoinsQuery } from './query/revertSendCoins'
import { revertSettledSendCoins as revertSettledSendCoinsQuery } from './query/revertSettledSendCoins'
import { settleSendCoins as settleSendCoinsQuery } from './query/settleSendCoins'
import { voteForSendCoins as voteForSendCoinsQuery } from './query/voteForSendCoins'

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
    logger.debug('X-Com: voteForSendCoins against endpoint=', this.endpoint)
    try {
      logger.debug(
        `X-Com: SendCoinsClient: voteForSendCoins with args=`,
        new SendCoinsArgsLoggingView(args),
      )
      const { data } = await this.client.rawRequest<{ voteForSendCoins: SendCoinsResult }>(
        voteForSendCoinsQuery,
        { args },
      )
      const result = data.voteForSendCoins
      if (!data?.voteForSendCoins?.vote) {
        logger.debug(
          'X-Com: voteForSendCoins failed with: ',
          new SendCoinsResultLoggingView(result),
        )
        return new SendCoinsResult()
      }
      logger.debug(
        'X-Com: voteForSendCoins successful with result=',
        new SendCoinsResultLoggingView(result),
      )
      return result
    } catch (err) {
      throw new LogError(`X-Com: voteForSendCoins failed for endpoint=${this.endpoint}:`, err)
    }
  }

  async revertSendCoins(args: SendCoinsArgs): Promise<boolean> {
    logger.debug('X-Com: revertSendCoins against endpoint=', this.endpoint)
    try {
      logger.debug(
        `X-Com: SendCoinsClient: revertSendCoins with args=`,
        new SendCoinsArgsLoggingView(args),
      )
      const { data } = await this.client.rawRequest<{ revertSendCoins: boolean }>(
        revertSendCoinsQuery,
        { args },
      )
      logger.debug(`X-Com: SendCoinsClient: after revertSendCoins: data=`, data)
      if (!data?.revertSendCoins) {
        logger.warn('X-Com: revertSendCoins without response data from endpoint', this.endpoint)
        return false
      }
      logger.debug(
        `X-Com: SendCoinsClient: revertSendCoins successful from endpoint=${this.endpoint}`,
      )
      return true
    } catch (err) {
      logger.error(
        `X-Com: SendCoinsClient: revertSendCoins failed for endpoint=${this.endpoint}`,
        err,
      )
      return false
    }
  }

  async settleSendCoins(args: SendCoinsArgs): Promise<boolean> {
    logger.debug(`X-Com: settleSendCoins against endpoint='${this.endpoint}'...`)
    try {
      logger.debug(
        `X-Com: SendCoinsClient: settleSendCoins with args=`,
        new SendCoinsArgsLoggingView(args),
      )
      const { data } = await this.client.rawRequest<{ settleSendCoins: boolean }>(
        settleSendCoinsQuery,
        { args },
      )
      logger.debug(`X-Com: SendCoinsClient: after settleSendCoins: data=`, data)
      if (!data?.settleSendCoins) {
        logger.warn(
          'X-Com: SendCoinsClient: settleSendCoins without response data from endpoint',
          this.endpoint,
        )
        return false
      }
      logger.debug(
        `X-Com: SendCoinsClient: settleSendCoins successful from endpoint=${this.endpoint}`,
      )
      return true
    } catch (err) {
      throw new LogError(
        `X-Com: SendCoinsClient: settleSendCoins failed for endpoint=${this.endpoint}`,
        err,
      )
    }
  }

  async revertSettledSendCoins(args: SendCoinsArgs): Promise<boolean> {
    logger.debug(`X-Com: revertSettledSendCoins against endpoint='${this.endpoint}'...`)
    try {
      logger.debug(
        `X-Com: SendCoinsClient: revertSettledSendCoins with args=`,
        new SendCoinsArgsLoggingView(args),
      )
      const { data } = await this.client.rawRequest<{ revertSettledSendCoins: boolean }>(
        revertSettledSendCoinsQuery,
        { args },
      )
      logger.debug(`X-Com: SendCoinsClient: after revertSettledSendCoins: data=`, data)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.revertSettledSendCoins) {
        logger.warn(
          'X-Com: SendCoinsClient: revertSettledSendCoins without response data from endpoint',
          this.endpoint,
        )
        return false
      }
      logger.debug(
        `X-Com: SendCoinsClient: revertSettledSendCoins successful from endpoint=${this.endpoint}`,
      )
      return true
    } catch (err) {
      throw new LogError(
        `X-Com: SendCoinsClient: revertSettledSendCoins failed for endpoint=${this.endpoint}`,
        err,
      )
    }
  }
}

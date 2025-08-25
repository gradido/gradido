import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'

import { ensureUrlEndsWithSlash } from '../../../util/utilities'
import { getLogger } from 'log4js'

import { LOG4JS_BASE_CATEGORY_NAME } from '../../../config/const'
import { revertSendCoins as revertSendCoinsQuery } from './query/revertSendCoins'
import { revertSettledSendCoins as revertSettledSendCoinsQuery } from './query/revertSettledSendCoins'
import { settleSendCoins as settleSendCoinsQuery } from './query/settleSendCoins'
import { voteForSendCoins as voteForSendCoinsQuery } from './query/voteForSendCoins'
import { EncryptedTransferArgs } from '../../../graphql/model/EncryptedTransferArgs'

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

  async voteForSendCoins(args: EncryptedTransferArgs): Promise<string | null> {
    logger.debug('voteForSendCoins against endpoint=', this.endpoint)
    try {
      const { data } = await this.client.rawRequest<{ voteForSendCoins: string }>(voteForSendCoinsQuery, { args })
      const responseJwt = data?.voteForSendCoins
      if (responseJwt) {
        logger.debug('received response jwt', responseJwt)
        return responseJwt
      }
    } catch (err) {
      const errmsg = `voteForSendCoins failed for endpoint=${this.endpoint}, err=${err}`
      logger.error(errmsg)
      throw new Error(errmsg)
    }
    return null
  }

  async revertSendCoins(args: EncryptedTransferArgs): Promise<boolean> {
    logger.debug('revertSendCoins against endpoint=', this.endpoint)
    try {
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

  async settleSendCoins(args: EncryptedTransferArgs): Promise<boolean> {
    logger.debug(`settleSendCoins against endpoint='${this.endpoint}'...`)
    try {
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
      const errmsg = `settleSendCoins failed for endpoint=${this.endpoint}, err=${err}`
      logger.error(errmsg)
      throw new Error(errmsg)
    }
  }

  async revertSettledSendCoins(args: EncryptedTransferArgs): Promise<boolean> {
    logger.debug(`revertSettledSendCoins against endpoint='${this.endpoint}'...`)
    try {
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
      const errmsg = `revertSettledSendCoins failed for endpoint=${this.endpoint}, err=${err}`
      logger.error(errmsg)
      throw new Error(errmsg)
    }
  }
}

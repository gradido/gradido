import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'

import { ensureUrlEndsWithSlash } from 'core'
import { getLogger } from 'log4js'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { EncryptedTransferArgs } from 'core'
import { processDisburseJwtOnSenderCommunity as processDisburseJwtOnSenderCommunityQuery } from './query/processDisburseJwtOnSenderCommunity'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.client.1_0.DisbursementClient`)

export class DisbursementClient {
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

  async sendDisburseJwtToSenderCommunity(args: EncryptedTransferArgs): Promise<string | null> {
    logger.debug('sendDisburseJwtToSenderCommunity against endpoint=', this.endpoint)
    try {
      const { data } = await this.client.rawRequest<{ processDisburseJwtOnSenderCommunity: string }>(processDisburseJwtOnSenderCommunityQuery, { args })
      const responseJwt = data?.processDisburseJwtOnSenderCommunity
      if (responseJwt) {
        logger.debug('received response jwt', responseJwt)
        return responseJwt
      }
    } catch (err) {
      const errmsg = `sendDisburseJwtToSenderCommunity failed for endpoint=${this.endpoint}, err=${err}`
      logger.error(errmsg)
      throw new Error(errmsg)
    }
    return null
  }

}

import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { GraphQLClient } from 'graphql-request'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { getPublicCommunityInfo } from '@/federation/client/1_0/query/getPublicCommunityInfo'
import { getPublicKey } from '@/federation/client/1_0/query/getPublicKey'
import { ensureUrlEndsWithSlash } from 'core'
import { getLogger } from 'log4js'

import { PublicCommunityInfoLoggingView } from './logging/PublicCommunityInfoLogging.view'
import { GetPublicKeyResult } from './model/GetPublicKeyResult'
import { PublicCommunityInfo } from './model/PublicCommunityInfo'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.client.1_0.FederationClient`)

export class FederationClient {
  dbCom: DbFederatedCommunity
  endpoint: string
  client: GraphQLClient

  constructor(dbCom: DbFederatedCommunity) {
    this.dbCom = dbCom
    this.endpoint = ensureUrlEndsWithSlash(dbCom.endPoint).concat(dbCom.apiVersion).concat('/')
    this.client = new GraphQLClient(this.endpoint, {
      method: 'GET',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    })
  }

  getEndpoint = () => {
    return this.endpoint
  }

  getPublicKey = async (): Promise<string | undefined> => {
    logger.debug('getPublicKey from endpoint', this.endpoint)
    try {
      const { data } = await this.client.rawRequest<{ getPublicKey: GetPublicKeyResult }>(
        getPublicKey,
        {},
      )
      if (!data?.getPublicKey?.publicKey) {
        logger.warn('getPublicKey without response data from endpoint', this.endpoint)
        return
      }
      logger.debug(
        'getPublicKey successful from endpoint',
        this.endpoint,
        data.getPublicKey.publicKey,
      )
      return data.getPublicKey.publicKey
    } catch (err) {
      const errorString = JSON.stringify(err)
      logger.warn('getPublicKey failed for endpoint', {
        endpoint: this.endpoint,
        err: errorString.length <= 200 ? errorString : errorString.substring(0, 200) + '...',
      })
    }
  }

  getPublicCommunityInfo = async (): Promise<PublicCommunityInfo | undefined> => {
    logger.debug(`getPublicCommunityInfo with endpoint='${this.endpoint}'...`)
    try {
      const { data } = await this.client.rawRequest<{
        getPublicCommunityInfo: PublicCommunityInfo
      }>(getPublicCommunityInfo, {})

      if (!data?.getPublicCommunityInfo?.name) {
        logger.warn('getPublicCommunityInfo without response data from endpoint', this.endpoint)
        return
      }
      logger.debug(`getPublicCommunityInfo successful from endpoint=${this.endpoint}`)
      logger.debug(
        `publicCommunityInfo:`,
        new PublicCommunityInfoLoggingView(data.getPublicCommunityInfo),
      )
      return data.getPublicCommunityInfo
    } catch (err) {
      logger.warn(' err', err)
      const errorString = JSON.stringify(err)
      logger.warn('getPublicCommunityInfo failed for endpoint', {
        endpoint: this.endpoint,
        err: errorString.length <= 200 ? errorString : errorString.substring(0, 200) + '...',
      })
    }
  }
}

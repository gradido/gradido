import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLClient } from 'graphql-request'

import { getPublicCommunityInfo } from '@/federation/client/1_0/query/getPublicCommunityInfo'
import { getPublicKey } from '@/federation/client/1_0/query/getPublicKey'
import { backendLogger as logger } from '@/server/logger'
import { ensureUrlEndsWithSlash } from '@/util/utilities'

import { PublicCommunityInfoLoggingView } from './logging/PublicCommunityInfoLogging.view'
import { GetPublicKeyResult } from './model/GetPublicKeyResult'
import { PublicCommunityInfo } from './model/PublicCommunityInfo'

export class FederationClient {
  dbCom: DbFederatedCommunity
  endpoint: string
  client: GraphQLClient

  constructor(dbCom: DbFederatedCommunity) {
    this.dbCom = dbCom
    this.endpoint = ensureUrlEndsWithSlash(dbCom.endPoint).concat(dbCom.apiVersion)
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
    logger.debug('Federation: getPublicKey from endpoint', this.endpoint)
    try {
      const { data } = await this.client.rawRequest<{ getPublicKey: GetPublicKeyResult }>(
        getPublicKey,
        {},
      )
      if (!data?.getPublicKey?.publicKey) {
        logger.warn('Federation: getPublicKey without response data from endpoint', this.endpoint)
        return
      }
      logger.debug(
        'Federation: getPublicKey successful from endpoint',
        this.endpoint,
        data.getPublicKey.publicKey,
      )
      return data.getPublicKey.publicKey
    } catch (err) {
      const errorString = JSON.stringify(err)
      logger.warn('Federation: getPublicKey failed for endpoint', {
        endpoint: this.endpoint,
        err: errorString.length <= 200 ? errorString : errorString.substring(0, 200) + '...',
      })
    }
  }

  getPublicCommunityInfo = async (): Promise<PublicCommunityInfo | undefined> => {
    logger.debug(`Federation: getPublicCommunityInfo with endpoint='${this.endpoint}'...`)
    try {
      const { data } = await this.client.rawRequest<{
        getPublicCommunityInfo: PublicCommunityInfo
      }>(getPublicCommunityInfo, {})

      if (!data?.getPublicCommunityInfo?.name) {
        logger.warn(
          'Federation: getPublicCommunityInfo without response data from endpoint',
          this.endpoint,
        )
        return
      }
      logger.debug(`Federation: getPublicCommunityInfo successful from endpoint=${this.endpoint}`)
      logger.debug(
        `publicCommunityInfo:`,
        new PublicCommunityInfoLoggingView(data.getPublicCommunityInfo),
      )
      return data.getPublicCommunityInfo
    } catch (err) {
      const errorString = JSON.stringify(err)
      logger.warn('Federation: getPublicCommunityInfo failed for endpoint', {
        endpoint: this.endpoint,
        err: errorString.length <= 200 ? errorString : errorString.substring(0, 200) + '...',
      })
    }
  }
}

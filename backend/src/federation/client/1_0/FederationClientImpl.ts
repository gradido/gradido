/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { gql } from 'graphql-request'

import { GraphQLGetClient } from '@/federation/client/GraphQLGetClient'
import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line import/no-relative-parent-imports
import { FederationClient, PublicCommunityInfo } from '../FederationClient'

export class FederationClientImpl implements FederationClient {
  public async requestGetPublicKey(dbCom: DbFederatedCommunity): Promise<string | undefined> {
    let endpoint = dbCom.endPoint.endsWith('/') ? dbCom.endPoint : dbCom.endPoint + '/'
    endpoint = `${endpoint}${dbCom.apiVersion}/`
    logger.info(`requestGetPublicKey with endpoint='${endpoint}'...`)

    const graphQLClient = GraphQLGetClient.getInstance(endpoint)
    logger.debug(`graphQLClient=${JSON.stringify(graphQLClient)}`)
    const query = gql`
      query {
        getPublicKey {
          publicKey
        }
      }
    `
    const variables = {}

    try {
      const { data, errors, extensions, headers, status } = await graphQLClient.rawRequest(
        query,
        variables,
      )
      logger.debug(`Response-Data:`, data, errors, extensions, headers, status)
      if (data) {
        logger.debug(`Response-PublicKey:`, data.getPublicKey.publicKey)
        logger.info(`requestGetPublicKey processed successfully`)
        return data.getPublicKey.publicKey
      }
      logger.warn(`requestGetPublicKey processed without response data`)
    } catch (err) {
      throw new LogError(`Request-Error:`, err)
    }
  }

  public async requestGetPublicCommunityInfo(
    dbCom: DbFederatedCommunity,
  ): Promise<PublicCommunityInfo | undefined> {
    let endpoint = dbCom.endPoint.endsWith('/') ? dbCom.endPoint : dbCom.endPoint + '/'
    endpoint = `${endpoint}${dbCom.apiVersion}/`
    logger.info(`requestGetPublicCommunityInfo with endpoint='${endpoint}'...`)

    const graphQLClient = GraphQLGetClient.getInstance(endpoint)
    logger.debug(`graphQLClient=${JSON.stringify(graphQLClient)}`)
    const query = gql`
      query {
        getPublicCommunityInfo {
          name
          description
          createdAt
          publicKey
        }
      }
    `
    const variables = {}

    try {
      const { data, errors, extensions, headers, status } = await graphQLClient.rawRequest(
        query,
        variables,
      )
      logger.debug(`Response-Data:`, data, errors, extensions, headers, status)
      if (data) {
        logger.debug(`Response-PublicCommunityInfo:`, data.getPublicCommunityInfo)
        logger.info(`requestGetPublicCommunityInfo processed successfully`)
        return data.getPublicCommunityInfo
      }
      logger.warn(`requestGetPublicInfo processed without response data`)
    } catch (err) {
      throw new LogError(`Request-Error:`, err)
    }
  }
}

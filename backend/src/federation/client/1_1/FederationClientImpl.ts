/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLError } from 'graphql/error/GraphQLError'
import { gql } from 'graphql-request'

import { GraphQLGetClient } from '@/federation/client/GraphQLGetClient'
import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line import/no-relative-parent-imports
import { FederationClient, PublicCommunityInfo } from '../FederationClient'

export class FederationClientImpl implements FederationClient {
  async requestGetPublicKey(dbCom: DbFederatedCommunity): Promise<string | undefined> {
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
      if (err instanceof GraphQLError) {
        logger.error(`RawRequest-Error on {} with message {}`, endpoint, err.message)
      }
      throw new Error(`Request-Error in requestGetPublicKey.`)
    }
  }

  async requestGetPublicCommunityInfo(
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
        logger.debug(
          `Response-PublicCommunityInfo:`,
          data.getPublicCommunityInfo.publicCommunityInfo,
        )
        logger.info(`requestGetPublicInfo processed successfully`)
        return data.getPublicCommunityInfo.publicCommunityInfo
      }
      logger.warn(`requestGetPublicInfo processed without response data`)
    } catch (err) {
      if (err instanceof GraphQLError) {
        logger.error(`RawRequest-Error on {} with message {}`, endpoint, err.message)
      }
      throw new Error(`Request-Error in requestGetPublicCommunityInfo.`)
    }
  }
}

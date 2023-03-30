/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { gql } from 'graphql-request'
import { Community as DbCommunity } from '@entity/Community'

import { GraphQLGetClient } from '@/federation/client/GraphQLGetClient'
import { backendLogger as logger } from '@/server/logger'
import LogError from '@/server/LogError'

export async function requestGetPublicKey(dbCom: DbCommunity): Promise<string | undefined> {
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

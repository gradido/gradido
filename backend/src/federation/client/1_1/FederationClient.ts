import { GraphQLClient, gql } from 'graphql-request'
import { backendLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from '@entity/Community'

// eslint-disable-next-line camelcase
export async function requestGetPublicKey(dbCom: DbCommunity): Promise<string | undefined> {
  let endpoint = dbCom.endPoint.endsWith('/') ? dbCom.endPoint : dbCom.endPoint + '/'
  endpoint = `${endpoint}${dbCom.apiVersion}/getPublicKey`
  logger.info(`requestGetPublicKey with endpoint='${endpoint}'...`)

  const graphQLClient = new GraphQLClient(endpoint, {
    method: 'GET',
    jsonSerializer: {
      parse: JSON.parse,
      stringify: JSON.stringify,
    },
  })
  logger.info(`graphQLClient=${JSON.stringify(graphQLClient)}`)
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
    logger.debug(
      `Response-Data: ${JSON.stringify(
        { data, errors, extensions, headers, status },
        undefined,
        2,
      )}`,
    )
    if (data) {
      logger.debug(`Response-PublicKey: ${data.getPublicKey.publicKey}`)
      logger.info(`requestGetPublicKey processed successfully`)
      return data.getPublicKey.publicKey
    }
    logger.warn(`requestGetPublicKey processed without response data`)
  } catch (err) {
    logger.error(`Request-Error:`, err) // ${JSON.stringify(err)}`)
  }
  return undefined
}

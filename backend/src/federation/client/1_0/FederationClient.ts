import { GraphQLClient, gql } from 'graphql-request'
import { backendLogger as logger } from '@/server/logger'
import { FdCommunity } from '@/federation/graphql/1_0/model/FdCommunity'

export async function requestGetPublicKey(fdCom: FdCommunity): Promise<string | undefined> {
  let endpoint = fdCom.url.endsWith('/') ? fdCom.url : fdCom.url + '/'
  endpoint = `${endpoint}${fdCom.apiVersion}/getPublicKey`
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

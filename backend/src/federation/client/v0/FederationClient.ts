import { GraphQLClient, gql } from 'graphql-request'
import { backendLogger as logger } from '@/server/logger'
import { FdCommunity } from '@/federation/graphql/v0/model/FdCommunity'

export async function requestGetPublicKey(fdCom: FdCommunity): Promise<string | undefined> {
  let endpoint = fdCom.url.endsWith('/') ? fdCom.url : fdCom.url + '/'
  endpoint = `${endpoint}graphql/v${fdCom.apiVersion}_getPublicKey`
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
    const data = await graphQLClient.request(query, variables)
    logger.info(`Response-Data: ${JSON.stringify(data)}`)
    if (data) {
      const json = JSON.parse(data.toString('ascii'))
      logger.info(`Response-Data: ${json}`)
      return json.publicKey
    }
    logger.info(`requestGetPublicKey processed successfully`)
  } catch (err) {
    logger.error(`Request-Error: ${JSON.stringify(err)}`)
  }
}

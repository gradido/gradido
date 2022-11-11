import { GraphQLClient, gql } from 'graphql-request'
import { FdCommunity } from '../model/FdCommunity'
import { backendLogger as logger } from '@/server/logger'

export async function requestGetPublicKey(fdCom: FdCommunity): Promise<void> {
  const endpoint = fdCom.url + '/' + fdCom.apiVersion + '/graphql/getPublicKey'
  logger.info(`requestGetPublicKey with endpoint='${endpoint}'...`)

  const graphQLClient = new GraphQLClient(endpoint, {
    method: 'GET',
    jsonSerializer: {
      parse: JSON.parse,
      stringify: JSON.stringify,
    },
  })

  const query = gql`
    query getPublicKey() {
      publicKey
    }
  `

  const variables = {}

  const data = await graphQLClient.request(query, variables)
  logger.info(`response of getPublicKey=${JSON.stringify(data)}`)
}

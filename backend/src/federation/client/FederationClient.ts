import { GraphQLClient, gql } from 'graphql-request'
import { backendLogger as logger } from '@/server/logger'
import { setFedComPubkeyVerifiedAt } from '@/dao/CommunityDAO'
import { FdCommunity } from '@/federation/graphql/1.0/model/FdCommunity'

export async function requestGetPublicKey(fdCom: FdCommunity): Promise<void> {
  let endpoint = fdCom.url.endsWith('/') ? fdCom.url : fdCom.url + '/'
  endpoint = endpoint + 'graphql/getPublicKey' // + fdCom.apiVersion + '/getPublicKey'
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
      if (json.publicKey === fdCom.publicKey) {
        logger.info(`Identic PubKey from RemoteCommunity...`)
        setFedComPubkeyVerifiedAt(fdCom.id, json.pubKey)
      }
    }
    logger.info(`requestGetPublicKey processed successfully`)
  } catch (err) {
    logger.error(`Request-Error: ${JSON.stringify(err)}`)
  }
}

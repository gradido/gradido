import { Community as DbCommunity } from '@entity/Community'
import { GraphQLClient, gql } from 'graphql-request'

import { LogError } from '@/server/LogError'
import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line camelcase
export class Client_1_0 {
  dbCom: DbCommunity
  endpoint: string
  client: GraphQLClient

  constructor(dbCom: DbCommunity) {
    this.dbCom = dbCom
    this.endpoint = `${dbCom.endPoint.endsWith('/') ? dbCom.endPoint : dbCom.endPoint + '/'}${
      dbCom.apiVersion
    }/`
    this.client = new GraphQLClient(this.endpoint, {
      method: 'GET',
      jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
      },
    })
  }

  requestGetPublicKey = async (): Promise<string | undefined> => {
    logger.info(`requestGetPublicKey with endpoint='${this.endpoint}'...`)

    const query = gql`
      query {
        getPublicKey {
          publicKey
        }
      }
    `

    const variables = {}

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data, errors, headers, status } = await this.client.rawRequest(query, variables)
      logger.debug(`Response-Data:`, data, errors, headers, status)
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        logger.debug(`Response-PublicKey:`, data.getPublicKey.publicKey)
        logger.info(`requestGetPublicKey processed successfully`)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return data.getPublicKey.publicKey
      }
      logger.warn(`requestGetPublicKey processed without response data`)
    } catch (err) {
      throw new LogError(`Request-Error:`, err)
    }
  }
}

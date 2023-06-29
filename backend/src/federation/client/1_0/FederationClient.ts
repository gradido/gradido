import { Community } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLClient } from 'graphql-request'

import { generateToken, verifyToken } from '@/federation/auth/JWE'
import { getPublicKey } from '@/federation/client/1_0/query/getPublicKey'
import { backendLogger as logger } from '@/server/logger'

import { randombytes_random } from 'sodium-native'

// eslint-disable-next-line camelcase
export class FederationClient {
  dbCom: DbFederatedCommunity
  endpoint: string
  client: GraphQLClient

  constructor(dbCom: DbFederatedCommunity) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async request(query: string, variables?: any) {
    const nonce = randombytes_random()
    const ownCommunity = await Community.findOneOrFail({ foreign: false })
    if (!ownCommunity.privateKey) {
      throw new Error('Own private key not in database')
    }

    const keyPair = { publicKey: ownCommunity.publicKey, privateKey: ownCommunity.privateKey }

    const token = await generateToken(nonce, keyPair, this.dbCom.publicKey)
    const response = await this.client.rawRequest(query, variables, {
      authorization: `Bearer ${token.toString()}`,
    })

    const responseToken = response.headers.get('token')

    if (!responseToken) {
      throw new Error('Response token missing')
    }

    const { publicKey } = await verifyToken(responseToken, keyPair, nonce)

    response.headers.set('publicKey', publicKey.toString())

    return response
  }

  getPublicKey = async (): Promise<string | undefined> => {
    logger.info('Federation: getPublicKey from endpoint', this.endpoint)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { data } = await this.request(getPublicKey, {})
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!data?.getPublicKey?.publicKey) {
        logger.warn('Federation: getPublicKey without response data from endpoint', this.endpoint)
        return
      }
      logger.info(
        'Federation: getPublicKey successful from endpoint',
        this.endpoint,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        data.getPublicKey.publicKey,
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return data.getPublicKey.publicKey
    } catch (err) {
      logger.warn('Federation: getPublicKey failed for endpoint', this.endpoint /* , err */)
    }
  }
}


import { Community } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLClient } from 'graphql-request'

import { generateToken, verifyToken } from '@/federation/auth/JWE'
import { getPublicKey } from '@/federation/client/1_0/query/getPublicKey'
import { backendLogger as logger } from '@/server/logger'

import { randombytes_random } from 'sodium-native'

export class FederationClient {
  dbCom: DbFederatedCommunity
  endpoint: string
  client: GraphQLClient

  constructor(dbCom: DbFederatedCommunity) {
    this.dbCom = dbCom
    this.endpoint = `${dbCom.endPoint.endsWith('/') ? dbCom.endPoint : dbCom.endPoint + '/'}${
      dbCom.apiVersion
    }/`
    // For local debugging
    // this.endpoint = 'http://federation:5010/'
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
    const ownCommunity = await Community.findOne({ where: { foreign: false } })
    if (!ownCommunity?.privateKey) {
      throw new Error('Own community or private key not in database')
    }

    const keyPair = { publicKey: ownCommunity.publicKey, privateKey: ownCommunity.privateKey }

    const token = await generateToken(nonce, keyPair, this.dbCom.publicKey)
    const response = await this.client.rawRequest(query, variables, {
      authorization: `Bearer ${token.toString()}`,
    })

    const responseToken = response.headers?.get('token')

    if (!responseToken) {
      throw new Error('Response token missing')
    }

    const { publicKey } = await verifyToken(responseToken, keyPair, nonce)

    // The header only allows normal characters - therefore we use hex
    response.headers.set('publicKey', Buffer.from(publicKey).toString('hex'))

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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      const publicKey = Buffer.from(data.getPublicKey.publicKey, 'hex')
      logger.info(
        'Federation: getPublicKey successful from endpoint',
        this.endpoint,
        publicKey.toString('hex'),
      )

      return publicKey.toString()
    } catch (err) {
      logger.warn('Federation: getPublicKey failed for endpoint', this.endpoint /*, err */)
    }
  }
}

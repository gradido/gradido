import { Community } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GraphQLClient } from 'graphql-request'
import jose from 'jose'

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
      throw new Error('Own private key not in database.')
    }
    const token = await this.generateToken(
      nonce,
      { publicKey: ownCommunity.publicKey, privateKey: ownCommunity.privateKey },
      this.dbCom.publicKey,
    )
    const response = this.client.rawRequest(query, variables, {
      authorization: `Bearer ${token.toString()}`,
    })
    return response
  }

  private async generateToken(
    nonce: number,
    keyPair: { publicKey: Buffer; privateKey: Buffer },
    recieverPublicKey: Buffer,
  ) {
    const jws = await new jose.CompactSign(new TextEncoder().encode(nonce.toString()))
      .setProtectedHeader({ alg: 'ES256' })
      .sign(keyPair.privateKey)
    return await new jose.CompactEncrypt(
      new TextEncoder().encode(
        JSON.stringify({
          jws,
          publicKey: keyPair.publicKey,
        }),
      ),
    )
      .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
      .encrypt(recieverPublicKey)
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
      logger.warn('Federation: getPublicKey failed for endpoint', this.endpoint)
    }
  }
}

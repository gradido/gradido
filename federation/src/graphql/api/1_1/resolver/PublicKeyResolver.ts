import { federationLogger as logger } from '@/server/logger'
import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { Query, Resolver } from 'type-graphql'
import { GetPublicKeyResult } from '../../1_0/model/GetPublicKeyResult'

@Resolver()
export class PublicKeyResolver {
  @Query(() => GetPublicKeyResult)
  async getPublicKey(): Promise<GetPublicKeyResult> {
    logger.debug(`getPublicKey() via apiVersion=1_0 ...`)
    const homeCom = await DbFederatedCommunity.findOneOrFail({
      where: {
        foreign: false,
        apiVersion: '1_1',
      },
    })
    const publicKeyHex = homeCom.publicKey.toString('hex')
    logger.debug(`getPublicKey()-1_1... return publicKey=${publicKeyHex}`)
    return new GetPublicKeyResult(publicKeyHex)
  }
}

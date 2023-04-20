// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Query, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GetPublicKeyResult } from '../model/GetPublicKeyResult'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PublicKeyResolver {
  @Query(() => GetPublicKeyResult)
  async getPublicKey(): Promise<GetPublicKeyResult> {
    logger.debug(`getPublicKey() via apiVersion=1_0 ...`)
    const homeCom = await DbFederatedCommunity.findOneOrFail({
      foreign: false,
      apiVersion: '1_0',
    })
    logger.info(`getPublicKey()-1_0... return publicKey=${homeCom.publicKey}`)
    return new GetPublicKeyResult(homeCom.publicKey.toString())
  }
}

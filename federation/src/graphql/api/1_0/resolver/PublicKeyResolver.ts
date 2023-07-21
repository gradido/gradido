// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Query, Resolver, Authorized } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { GetPublicKeyResult } from '../model/GetPublicKeyResult'
import { RIGHTS } from '@/auth/RIGHTS'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PublicKeyResolver {
  @Authorized([RIGHTS.GET_PUBLIC_KEY])
  @Query(() => GetPublicKeyResult)
  async getPublicKey(): Promise<GetPublicKeyResult> {
    logger.debug(`getPublicKey() via apiVersion=1_0 ...`)
    const homeCom = await DbFederatedCommunity.findOneOrFail({
      where: {
        foreign: false,
        apiVersion: '1_0',
      },
    })
    logger.info(`getPublicKey()-1_0... return publicKey=${homeCom.publicKey.toString('hex')}`)
    return new GetPublicKeyResult(homeCom.publicKey.toString())
  }
}

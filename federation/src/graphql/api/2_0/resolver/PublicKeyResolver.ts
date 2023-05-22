// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Query, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PublicKeyResolver {
  @Query(() => String)
  async getPublicKey(): Promise<string> {
    const homeCom = await DbFederatedCommunity.findOneOrFail({ foreign: false })
    logger.info(`getPublicKey()-2_0... return publicKey=${homeCom.publicKey}`)
    return homeCom.publicKey.toString()
  }
}

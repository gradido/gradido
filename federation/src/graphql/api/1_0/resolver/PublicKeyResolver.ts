// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Query, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from '@entity/Community'
import { GetPublicKeyResult } from '../model/GetPublicKeyResult'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PublicKeyResolver {
  @Query(() => GetPublicKeyResult)
  async getPublicKey(): Promise<GetPublicKeyResult> {
    logger.info(`getPublicKey()...`)
    const homeCom = await DbCommunity.findOneOrFail({
      foreign: false,
      apiVersion: '1_0',
    })
    logger.info(`getPublicKey()... with publicKey=${homeCom.publicKey}`)
    return new GetPublicKeyResult(homeCom.publicKey.toString())
  }
}

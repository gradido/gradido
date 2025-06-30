import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { getLogger } from 'log4js'
import { Query, Resolver } from 'type-graphql'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { GetPublicKeyResult } from '../model/GetPublicKeyResult'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.PublicKeyResolver`)

@Resolver()
export class PublicKeyResolver {
  @Query(() => GetPublicKeyResult)
  async getPublicKey(): Promise<GetPublicKeyResult> {
    logger.debug(`getPublicKey() via apiVersion=1_0 ...`)
    const homeCom = await DbFederatedCommunity.findOneOrFail({
      where: {
        foreign: false,
        apiVersion: '1_0',
      },
    })
    const publicKeyHex = homeCom.publicKey.toString('hex')
    logger.debug(`getPublicKey()-1_0... return publicKey=${publicKeyHex}`)
    return new GetPublicKeyResult(publicKeyHex)
  }
}

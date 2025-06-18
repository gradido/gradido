import { FederatedCommunity as DbFederatedCommunity } from 'database'
import { getLogger } from 'log4js'
import { Query, Resolver } from 'type-graphql'
import { LOG4JS_RESOLVER_1_1_CATEGORY_NAME } from '.'
import { GetPublicKeyResult } from '../../1_0/model/GetPublicKeyResult'

const logger = getLogger(`${LOG4JS_RESOLVER_1_1_CATEGORY_NAME}.PublicKeyResolver`)

@Resolver()
export class PublicKeyResolver {
  @Query(() => GetPublicKeyResult)
  async getPublicKey(): Promise<GetPublicKeyResult> {
    logger.debug(`getPublicKey()...`)
    const homeCom = await DbFederatedCommunity.findOneOrFail({
      where: {
        foreign: false,
        apiVersion: '1_1',
      },
    })
    const publicKeyHex = homeCom.publicKey.toString('hex')
    logger.debug(`getPublicKey()... return publicKey=${publicKeyHex}`)
    return new GetPublicKeyResult(publicKeyHex)
  }
}

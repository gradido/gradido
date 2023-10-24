// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Arg, Mutation, Resolver } from 'type-graphql'
import { federationLogger as logger } from '@/server/logger'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFedCommunity } from '@entity/FederatedCommunity'
import { LogError } from '@/server/LogError'
import { OpenConnectionArgs } from '../model/OpenConnectionArgs'
import { startAuthentication, startOpenConnectionCallback } from '../util/authenticateCommunity'
import { OpenConnectionCallbackArgs } from '../model/OpenConnectionCallbackArgs'
import { CONFIG } from '@/config'
import { AuthenticationArgs } from '../model/AuthenticationArgs'

@Resolver()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class AuthenticationResolver {
  @Mutation(() => Boolean)
  async openConnection(
    @Arg('data')
    args: OpenConnectionArgs,
  ): Promise<boolean> {
    logger.debug(
      `Authentication: openConnection() via apiVersion=1_0 ...`,
      args.url,
      Buffer.from(args.publicKey, 'hex').toString(),
    )

    // first find with args.publicKey the community, which starts openConnection request
    const requestedCom = await DbCommunity.findOneBy({
      publicKey: Buffer.from(args.publicKey),
    })
    if (!requestedCom) {
      throw new LogError(
        `unknown requesting community with publicKey`,
        Buffer.from(args.publicKey, 'hex').toString(),
      )
    }
    logger.debug(`Authentication: found requestedCom:`, requestedCom)
    // no await to respond immediatly and invoke callback-request asynchron
    void startOpenConnectionCallback(args, requestedCom, CONFIG.FEDERATION_API)
    return true
  }

  @Mutation(() => Boolean)
  async openConnectionCallback(
    @Arg('data')
    args: OpenConnectionCallbackArgs,
  ): Promise<boolean> {
    logger.debug(`Authentication: openConnectionCallback() via apiVersion=1_0 ...`, args)
    // TODO decrypt args.url with homeCom.privateKey and verify signing with callbackFedCom.publicKey
    const endPoint = args.url.slice(0, args.url.lastIndexOf('/'))
    const apiVersion = args.url.slice(args.url.lastIndexOf('/'), args.url.length)
    logger.debug(`Authentication: search fedCom per:`, endPoint, apiVersion)
    const callbackFedCom = await DbFedCommunity.findOneBy({ endPoint, apiVersion })
    if (!callbackFedCom) {
      throw new LogError(`unknown callback community with url`, args.url)
    }
    logger.debug(`Authentication: found fedCom and start authentication:`, callbackFedCom)
    // no await to respond immediatly and invoke authenticate-request asynchron
    void startAuthentication(args.oneTimeCode, callbackFedCom)
    return true
  }

  @Mutation(() => String)
  async authenticate(
    @Arg('data')
    args: AuthenticationArgs,
  ): Promise<string | null> {
    logger.debug(`Authentication: authenticate() via apiVersion=1_0 ...`, args)
    const authCom = await DbCommunity.findOneByOrFail({ communityUuid: args.oneTimeCode })
    logger.debug('Authentication: found authCom:', authCom)
    if (authCom) {
      // TODO decrypt args.uuid with authCom.publicKey
      authCom.communityUuid = args.uuid
      await DbCommunity.save(authCom)
      logger.debug('Authentication: store authCom.uuid successfully:', authCom)
      const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
      // TODO encrypt homeCom.uuid with homeCom.privateKey
      if (homeCom.communityUuid) {
        return homeCom.communityUuid
      }
    }
    return null
  }
}

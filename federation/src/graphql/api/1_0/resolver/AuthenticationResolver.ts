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
    const pubKeyBuf = Buffer.from(args.publicKey, 'hex')
    logger.debug(`Authentication: openConnection() via apiVersion=1_0:`, args)
    logger.debug(`Authentication: url=`, args.url)
    logger.debug(`Authentication: publicKey=`, args.publicKey)
    logger.debug(`Authentication: pubKeyBuf=`, pubKeyBuf)
    logger.debug(`Authentication: pubKeyBufString=`, pubKeyBuf.toString('hex'))

    // first find with args.publicKey the community 'comA', which starts openConnection request
    const comA = await DbCommunity.findOneBy({
      publicKey: pubKeyBuf, // Buffer.from(args.publicKey),
    })
    if (!comA) {
      throw new LogError(`unknown requesting community with publicKey`, pubKeyBuf.toString('hex'))
    }
    logger.debug(`Authentication: found requestedCom:`, comA)
    // no await to respond immediatly and invoke callback-request asynchron
    void startOpenConnectionCallback(args, comA, CONFIG.FEDERATION_API)
    return true
  }

  @Mutation(() => Boolean)
  async openConnectionCallback(
    @Arg('data')
    args: OpenConnectionCallbackArgs,
  ): Promise<boolean> {
    logger.debug(`Authentication: openConnectionCallback() via apiVersion=1_0 ...`, args)
    // TODO decrypt args.url with homeCom.privateKey and verify signing with callbackFedCom.publicKey
    const endPoint = args.url.slice(0, args.url.lastIndexOf('/') + 1)
    const apiVersion = args.url.slice(args.url.lastIndexOf('/') + 1, args.url.length)
    logger.debug(`Authentication: search fedComB per:`, endPoint, apiVersion)
    const fedComB = await DbFedCommunity.findOneBy({ endPoint, apiVersion })
    if (!fedComB) {
      throw new LogError(`unknown callback community with url`, args.url)
    }
    logger.debug(`Authentication: found fedComB and start authentication:`, fedComB)
    // no await to respond immediatly and invoke authenticate-request asynchron
    void startAuthentication(args.oneTimeCode, fedComB)
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

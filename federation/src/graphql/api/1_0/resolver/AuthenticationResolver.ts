import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import {
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
} from 'database'
import { getLogger } from 'log4js'
import { Arg, Mutation, Resolver } from 'type-graphql'
import { LOG4JS_RESOLVER_1_0_CATEGORY_NAME } from '.'
import { AuthenticationArgs } from '../model/AuthenticationArgs'
import { OpenConnectionArgs } from '../model/OpenConnectionArgs'
import { OpenConnectionCallbackArgs } from '../model/OpenConnectionCallbackArgs'
import { startAuthentication, startOpenConnectionCallback } from '../util/authenticateCommunity'

const logger = getLogger(`${LOG4JS_RESOLVER_1_0_CATEGORY_NAME}.AuthenticationResolver`)

@Resolver()
export class AuthenticationResolver {
  @Mutation(() => Boolean)
  async openConnection(
    @Arg('data')
    args: OpenConnectionArgs,
  ): Promise<boolean> {
    const pubKeyBuf = Buffer.from(args.publicKey, 'hex')
    logger.debug(`openConnection() via apiVersion=1_0:`, args)

    // first find with args.publicKey the community 'comA', which starts openConnection request
    const comA = await DbCommunity.findOneBy({
      publicKey: pubKeyBuf, // Buffer.from(args.publicKey),
    })
    if (!comA) {
      throw new LogError(`unknown requesting community with publicKey`, pubKeyBuf.toString('hex'))
    }
    logger.debug(`found requestedCom:`, new CommunityLoggingView(comA))
    // biome-ignore lint/complexity/noVoid: no await to respond immediately and invoke callback-request asynchronously
    void startOpenConnectionCallback(args, comA, CONFIG.FEDERATION_API)
    return true
  }

  @Mutation(() => Boolean)
  async openConnectionCallback(
    @Arg('data')
    args: OpenConnectionCallbackArgs,
  ): Promise<boolean> {
    logger.debug(`openConnectionCallback() via apiVersion=1_0 ...`, args)
    // TODO decrypt args.url with homeCom.privateKey and verify signing with callbackFedCom.publicKey
    const endPoint = args.url.slice(0, args.url.lastIndexOf('/') + 1)
    const apiVersion = args.url.slice(args.url.lastIndexOf('/') + 1, args.url.length)
    logger.debug(`search fedComB per:`, endPoint, apiVersion)
    const fedComB = await DbFedCommunity.findOneBy({ endPoint, apiVersion })
    if (!fedComB) {
      throw new LogError(`unknown callback community with url`, args.url)
    }
    logger.debug(
      `found fedComB and start authentication:`,
      new FederatedCommunityLoggingView(fedComB),
    )
    // biome-ignore lint/complexity/noVoid: no await to respond immediately and invoke authenticate-request asynchronously
    void startAuthentication(args.oneTimeCode, fedComB)
    return true
  }

  @Mutation(() => String)
  async authenticate(
    @Arg('data')
    args: AuthenticationArgs,
  ): Promise<string | null> {
    logger.debug(`authenticate() via apiVersion=1_0 ...`, args)
    const authCom = await DbCommunity.findOneByOrFail({ communityUuid: args.oneTimeCode })
    logger.debug('found authCom:', new CommunityLoggingView(authCom))
    if (authCom) {
      // TODO decrypt args.uuid with authCom.publicKey
      authCom.communityUuid = args.uuid
      authCom.authenticatedAt = new Date()
      await DbCommunity.save(authCom)
      logger.debug('store authCom.uuid successfully:', new CommunityLoggingView(authCom))
      const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
      // TODO encrypt homeCom.uuid with homeCom.privateKey
      if (homeCom.communityUuid) {
        return homeCom.communityUuid
      }
    }
    return null
  }
}

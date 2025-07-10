import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { AuthenticationJwtPayloadType, AuthenticationResponseJwtPayloadType, encryptAndSign, EncryptedTransferArgs, interpretEncryptedTransferArgs, OpenConnectionCallbackJwtPayloadType, OpenConnectionJwtPayloadType } from 'core'
import {
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { Arg, Mutation, Resolver } from 'type-graphql'
import { startAuthentication, startOpenConnectionCallback } from '../util/authenticateCommunity'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.AuthenticationResolver`)

@Resolver()
export class AuthenticationResolver {
  @Mutation(() => Boolean)
  async openConnection(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<boolean> {
    logger.addContext('handshakeID', args.handshakeID)
    logger.debug(`openConnection() via apiVersion=1_0:`, args)
    const openConnectionJwtPayload = await interpretEncryptedTransferArgs(args) as OpenConnectionJwtPayloadType
    logger.debug('openConnectionJwtPayload', openConnectionJwtPayload)
    if (!openConnectionJwtPayload) {
      const errmsg = `invalid OpenConnection payload of requesting community with publicKey` + args.publicKey
      logger.error(errmsg)
      logger.removeContext('handshakeID')
      throw new Error(errmsg)
    }
    if (openConnectionJwtPayload.tokentype !== OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE) {
      const errmsg = `invalid tokentype of community with publicKey` + args.publicKey
      logger.error(errmsg)
      logger.removeContext('handshakeID')
      throw new Error(errmsg)
    }
    if (!openConnectionJwtPayload.url) {
      const errmsg = `invalid url of community with publicKey` + args.publicKey
      logger.error(errmsg)
      logger.removeContext('handshakeID')
      throw new Error(errmsg)
    }
    const pubKeyComA = Buffer.from(args.publicKey)
    logger.debug('pubKeyComA', pubKeyComA.toString('hex'))
    logger.debug('args.publicKey', args.publicKey)
    const fedComA = await DbFedCommunity.findOneByOrFail({ publicKey: pubKeyComA })
    logger.debug('fedComA', new FederatedCommunityLoggingView(fedComA))
    if (!openConnectionJwtPayload.url.startsWith(fedComA.endPoint)) {
      const errmsg = `invalid url of community with publicKey` + args.publicKey
      logger.error(errmsg)
      logger.removeContext('handshakeID')
      throw new Error(errmsg)
    }

    // biome-ignore lint/complexity/noVoid: no await to respond immediately and invoke callback-request asynchronously
    void startOpenConnectionCallback(args.handshakeID, args.publicKey, CONFIG.FEDERATION_API)
    logger.removeContext('handshakeID')
    return true
  }

  @Mutation(() => Boolean)
  async openConnectionCallback(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<boolean> {
    logger.addContext('handshakeID', args.handshakeID)
    logger.debug(`openConnectionCallback() via apiVersion=1_0 ...`, args)
    // decrypt args.url with homeCom.privateJwtKey and verify signing with callbackFedCom.publicKey
    const openConnectionCallbackJwtPayload = await interpretEncryptedTransferArgs(args) as OpenConnectionCallbackJwtPayloadType
    if (!openConnectionCallbackJwtPayload) {
      const errmsg = `invalid OpenConnectionCallback payload of requesting community with publicKey` + args.publicKey
      logger.error(errmsg)
      logger.removeContext('handshakeID')
      throw new Error(errmsg)
    }

    const endPoint = openConnectionCallbackJwtPayload.url.slice(0, openConnectionCallbackJwtPayload.url.lastIndexOf('/') + 1)
    const apiVersion = openConnectionCallbackJwtPayload.url.slice(openConnectionCallbackJwtPayload.url.lastIndexOf('/') + 1, openConnectionCallbackJwtPayload.url.length)
    logger.debug(`search fedComB per:`, endPoint, apiVersion)
    const fedComB = await DbFedCommunity.findOneBy({ endPoint, apiVersion })
    if (!fedComB) {
      const errmsg = `unknown callback community with url` + openConnectionCallbackJwtPayload.url
      logger.error(errmsg)
      logger.removeContext('handshakeID')
      throw new Error(errmsg)
    }
    logger.debug(
      `found fedComB and start authentication:`,
      new FederatedCommunityLoggingView(fedComB),
    )
    // biome-ignore lint/complexity/noVoid: no await to respond immediately and invoke authenticate-request asynchronously
    void startAuthentication(args.handshakeID, openConnectionCallbackJwtPayload.oneTimeCode, fedComB)
    logger.removeContext('handshakeID')
    return true
  }

  @Mutation(() => String)
  async authenticate(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<string | null> {
    logger.addContext('handshakeID', args.handshakeID)
    logger.debug(`authenticate() via apiVersion=1_0 ...`, args)
    const authArgs = await interpretEncryptedTransferArgs(args) as AuthenticationJwtPayloadType
    if (!authArgs) {
      const errmsg = `invalid authentication payload of requesting community with publicKey` + args.publicKey
      logger.error(errmsg)
      logger.removeContext('handshakeID')
      throw new Error(errmsg)
    }
    const authCom = await DbCommunity.findOneByOrFail({ communityUuid: authArgs.oneTimeCode })
    logger.debug('found authCom:', new CommunityLoggingView(authCom))
    if (authCom) {
      authCom.communityUuid = authArgs.uuid
      authCom.authenticatedAt = new Date()
      await DbCommunity.save(authCom)
      logger.debug('store authCom.uuid successfully:', new CommunityLoggingView(authCom))
      const homeComB = await getHomeCommunity()
      if (homeComB?.communityUuid) {
        const responseArgs = new AuthenticationResponseJwtPayloadType(homeComB.communityUuid)
        const responseJwt = await encryptAndSign(responseArgs, homeComB.privateJwtKey!, authCom.publicJwtKey!)
        logger.removeContext('handshakeID')
        return responseJwt
      }
    }
    logger.removeContext('handshakeID')
    return null
  }
}

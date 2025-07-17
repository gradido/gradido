import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { EncryptedTransferArgs, interpretEncryptedTransferArgs } from 'core'
import {
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { AuthenticationJwtPayloadType, AuthenticationResponseJwtPayloadType, encryptAndSign, OpenConnectionCallbackJwtPayloadType, OpenConnectionJwtPayloadType } from 'shared'
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
    const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.AuthenticationResolver.openConnection`)
    methodLogger.addContext('handshakeID', args.handshakeID)
    methodLogger.debug(`openConnection() via apiVersion=1_0:`, args)
    const openConnectionJwtPayload = await interpretEncryptedTransferArgs(args) as OpenConnectionJwtPayloadType
    methodLogger.debug('openConnectionJwtPayload', openConnectionJwtPayload)
    if (!openConnectionJwtPayload) {
      const errmsg = `invalid OpenConnection payload of requesting community with publicKey` + args.publicKey
      methodLogger.error(errmsg)
      methodLogger.removeContext('handshakeID')
      throw new Error(errmsg)
    }
    if (openConnectionJwtPayload.tokentype !== OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE) {
      const errmsg = `invalid tokentype of community with publicKey` + args.publicKey
      methodLogger.error(errmsg)
      methodLogger.removeContext('handshakeID')
      throw new Error(errmsg)
    }
    if (!openConnectionJwtPayload.url) {
      const errmsg = `invalid url of community with publicKey` + args.publicKey
      methodLogger.error(errmsg)
      methodLogger.removeContext('handshakeID')
      throw new Error(errmsg)
    }
    methodLogger.debug(`vor DbFedCommunity.findOneByOrFail()...`, { publicKey: args.publicKey })
    const fedComA = await DbFedCommunity.findOneByOrFail({ publicKey: Buffer.from(args.publicKey, 'hex') })
    methodLogger.debug(`nach DbFedCommunity.findOneByOrFail()...`, fedComA)
    methodLogger.debug('fedComA', new FederatedCommunityLoggingView(fedComA))
    if (!openConnectionJwtPayload.url.startsWith(fedComA.endPoint)) {
      const errmsg = `invalid url of community with publicKey` + args.publicKey
      methodLogger.error(errmsg)
      methodLogger.removeContext('handshakeID')
      throw new Error(errmsg)
    }

    // no await to respond immediately and invoke callback-request asynchronously
    void startOpenConnectionCallback(args.handshakeID, args.publicKey, CONFIG.FEDERATION_API)
    methodLogger.debug('openConnection() successfully initiated callback and returns true immediately...')
    methodLogger.removeContext('handshakeID')
    return true
  }

  @Mutation(() => Boolean)
  async openConnectionCallback(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<boolean> {
    const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.AuthenticationResolver.openConnectionCallback`)
    methodLogger.addContext('handshakeID', args.handshakeID)
    methodLogger.debug(`openConnectionCallback() via apiVersion=1_0 ...`, args)
    // decrypt args.url with homeCom.privateJwtKey and verify signing with callbackFedCom.publicKey
    const openConnectionCallbackJwtPayload = await interpretEncryptedTransferArgs(args) as OpenConnectionCallbackJwtPayloadType
    if (!openConnectionCallbackJwtPayload) {
      const errmsg = `invalid OpenConnectionCallback payload of requesting community with publicKey` + args.publicKey
      methodLogger.error(errmsg)
      methodLogger.removeContext('handshakeID')
      throw new Error(errmsg)
    }

    const endPoint = openConnectionCallbackJwtPayload.url.slice(0, openConnectionCallbackJwtPayload.url.lastIndexOf('/') + 1)
    const apiVersion = openConnectionCallbackJwtPayload.url.slice(openConnectionCallbackJwtPayload.url.lastIndexOf('/') + 1, openConnectionCallbackJwtPayload.url.length)
    methodLogger.debug(`search fedComB per:`, endPoint, apiVersion)
    const fedComB = await DbFedCommunity.findOneBy({ endPoint, apiVersion })
    if (!fedComB) {
      const errmsg = `unknown callback community with url` + openConnectionCallbackJwtPayload.url
      methodLogger.error(errmsg)
      methodLogger.removeContext('handshakeID')
      throw new Error(errmsg)
    }
    methodLogger.debug(
      `found fedComB and start authentication:`,
      new FederatedCommunityLoggingView(fedComB),
    )
    // no await to respond immediately and invoke authenticate-request asynchronously
    void startAuthentication(args.handshakeID, openConnectionCallbackJwtPayload.oneTimeCode, fedComB)
    methodLogger.debug('openConnectionCallback() successfully initiated authentication and returns true immediately...')
    methodLogger.removeContext('handshakeID')
    return true
  }

  @Mutation(() => String)
  async authenticate(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<string | null> {
    const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.AuthenticationResolver.authenticate`)
    methodLogger.addContext('handshakeID', args.handshakeID)
    methodLogger.debug(`authenticate() via apiVersion=1_0 ...`, args)
    const authArgs = await interpretEncryptedTransferArgs(args) as AuthenticationJwtPayloadType
    if (!authArgs) {
      const errmsg = `invalid authentication payload of requesting community with publicKey` + args.publicKey
      methodLogger.error(errmsg)
      methodLogger.removeContext('handshakeID')
      throw new Error(errmsg)
    }
    const authCom = await DbCommunity.findOneByOrFail({ communityUuid: authArgs.oneTimeCode })
    methodLogger.debug('found authCom:', new CommunityLoggingView(authCom))
    if (authCom) {
      authCom.communityUuid = authArgs.uuid
      authCom.authenticatedAt = new Date()
      await DbCommunity.save(authCom)
      methodLogger.debug('store authCom.uuid successfully:', new CommunityLoggingView(authCom))
      const homeComB = await getHomeCommunity()
      if (homeComB?.communityUuid) {
        const responseArgs = new AuthenticationResponseJwtPayloadType(args.handshakeID,homeComB.communityUuid)
        const responseJwt = await encryptAndSign(responseArgs, homeComB.privateJwtKey!, authCom.publicJwtKey!)
        methodLogger.removeContext('handshakeID')
        return responseJwt
      }
    }
    methodLogger.removeContext('handshakeID')
    return null
  }
}

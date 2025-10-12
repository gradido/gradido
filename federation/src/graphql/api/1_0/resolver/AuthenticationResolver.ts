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
import { 
  AuthenticationJwtPayloadType, 
  AuthenticationResponseJwtPayloadType, 
  encryptAndSign, 
  OpenConnectionCallbackJwtPayloadType, 
  OpenConnectionJwtPayloadType, 
  uint32Schema, 
  uuidv4Schema 
} from 'shared'
import { Arg, Mutation, Resolver } from 'type-graphql'
import { startAuthentication, startOpenConnectionCallback } from '../util/authenticateCommunity'

const createLogger = (method: string  ) => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.AuthenticationResolver.${method}`)

@Resolver()
export class AuthenticationResolver {
  @Mutation(() => Boolean)
  async openConnection(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<boolean> {
    const methodLogger = createLogger('openConnection')
    methodLogger.addContext('handshakeID', args.handshakeID)
    methodLogger.debug(`openConnection() via apiVersion=1_0:`, args)
    try {
      const openConnectionJwtPayload = await interpretEncryptedTransferArgs(args) as OpenConnectionJwtPayloadType
      methodLogger.debug('openConnectionJwtPayload', openConnectionJwtPayload)
      if (!openConnectionJwtPayload) {
        const errmsg = `invalid OpenConnection payload of requesting community with publicKey` + args.publicKey
        methodLogger.error(errmsg)
        // no infos to the caller
        return true
      }
      if (openConnectionJwtPayload.tokentype !== OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE) {
        const errmsg = `invalid tokentype of community with publicKey` + args.publicKey
        methodLogger.error(errmsg)
        // no infos to the caller
        return true
      }
      if (!openConnectionJwtPayload.url) {
        const errmsg = `invalid url of community with publicKey` + args.publicKey
        methodLogger.error(errmsg)
        // no infos to the caller
        return true
      }
      methodLogger.debug(`vor DbFedCommunity.findOneByOrFail()...`, { publicKey: args.publicKey })
      const fedComA = await DbFedCommunity.findOneByOrFail({ publicKey: Buffer.from(args.publicKey, 'hex') })
      methodLogger.debug(`nach DbFedCommunity.findOneByOrFail()...`, fedComA)
      methodLogger.debug('fedComA', new FederatedCommunityLoggingView(fedComA))
      if (!openConnectionJwtPayload.url.startsWith(fedComA.endPoint)) {
        const errmsg = `invalid url of community with publicKey` + args.publicKey
        methodLogger.error(errmsg)
        // no infos to the caller
        return true
      }

      // no await to respond immediately and invoke callback-request asynchronously
      void startOpenConnectionCallback(args.handshakeID, args.publicKey, CONFIG.FEDERATION_API)
      methodLogger.debug('openConnection() successfully initiated callback and returns true immediately...')
      return true
    } catch (err) {
      methodLogger.error('invalid jwt token:', err)
      return true
    }
  }

  @Mutation(() => Boolean)
  async openConnectionCallback(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<boolean> {
    const methodLogger = createLogger('openConnectionCallback')
    methodLogger.addContext('handshakeID', args.handshakeID)
    methodLogger.debug(`openConnectionCallback() via apiVersion=1_0 ...`, args)
    try {
    // decrypt args.url with homeCom.privateJwtKey and verify signing with callbackFedCom.publicKey
      const openConnectionCallbackJwtPayload = await interpretEncryptedTransferArgs(args) as OpenConnectionCallbackJwtPayloadType
      if (!openConnectionCallbackJwtPayload) {
        const errmsg = `invalid OpenConnectionCallback payload of requesting community with publicKey` + args.publicKey
        methodLogger.error(errmsg)
        // no infos to the caller
        return true
      }

      const endPoint = openConnectionCallbackJwtPayload.url.slice(0, openConnectionCallbackJwtPayload.url.lastIndexOf('/') + 1)
      const apiVersion = openConnectionCallbackJwtPayload.url.slice(openConnectionCallbackJwtPayload.url.lastIndexOf('/') + 1, openConnectionCallbackJwtPayload.url.length)
      methodLogger.debug(`search fedComB per:`, endPoint, apiVersion)
      const fedComB = await DbFedCommunity.findOneBy({ endPoint, apiVersion })
      if (!fedComB) {
        const errmsg = `unknown callback community with url` + openConnectionCallbackJwtPayload.url
        methodLogger.error(errmsg)
        // no infos to the caller
        return true
      }
      methodLogger.debug(
        `found fedComB and start authentication:`,
        new FederatedCommunityLoggingView(fedComB),
      )
      // no await to respond immediately and invoke authenticate-request asynchronously
      void startAuthentication(args.handshakeID, openConnectionCallbackJwtPayload.oneTimeCode, fedComB)
      methodLogger.debug('openConnectionCallback() successfully initiated authentication and returns true immediately...')
      return true
    } catch (err) {
      methodLogger.error('invalid jwt token:', err)
      return true
    }
  }

  @Mutation(() => String, { nullable: true })
  async authenticate(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<string | null> {
    const methodLogger = createLogger('authenticate')
    methodLogger.addContext('handshakeID', args.handshakeID)
    methodLogger.debug(`authenticate() via apiVersion=1_0 ...`, args)
    try {
      const authArgs = await interpretEncryptedTransferArgs(args) as AuthenticationJwtPayloadType
      methodLogger.debug(`interpreted authentication payload...authArgs:`, authArgs)
      if (!authArgs) {
        const errmsg = `invalid authentication payload of requesting community with publicKey` + args.publicKey
        methodLogger.error(errmsg)
        // no infos to the caller
        return null
      }

      if (!uint32Schema.safeParse(Number(authArgs.oneTimeCode)).success) {
        const errmsg = `invalid oneTimeCode: ${authArgs.oneTimeCode} for community with publicKey ${authArgs.publicKey}, expect uint32`
        methodLogger.error(errmsg)
        // no infos to the caller
        return null
      }

      methodLogger.debug(`search community per oneTimeCode:`, authArgs.oneTimeCode)
      const authCom = await DbCommunity.findOneByOrFail({ communityUuid: authArgs.oneTimeCode })
      if (authCom) {
        methodLogger.debug('found authCom:', new CommunityLoggingView(authCom))
        methodLogger.debug('authCom.publicKey', authCom.publicKey.toString('hex'))
        methodLogger.debug('args.publicKey', args.publicKey)
        if (authCom.publicKey.compare(Buffer.from(args.publicKey, 'hex')) !== 0) {
          const errmsg = `corrupt authentication call detected, oneTimeCode: ${authArgs.oneTimeCode} doesn't belong to caller: ${args.publicKey}`
          methodLogger.error(errmsg)
          // no infos to the caller
          return null
        }
        const communityUuid = uuidv4Schema.safeParse(authArgs.uuid)
        if (!communityUuid.success) {
          const errmsg = `invalid uuid: ${authArgs.uuid} for community with publicKey ${authCom.publicKey}`
          methodLogger.error(errmsg)
          // no infos to the caller
          return null
        }
        authCom.communityUuid = communityUuid.data
        authCom.authenticatedAt = new Date()
        await DbCommunity.save(authCom)
        methodLogger.debug('store authCom.uuid successfully:', new CommunityLoggingView(authCom))
        const homeComB = await getHomeCommunity()
        if (homeComB?.communityUuid) {
          const responseArgs = new AuthenticationResponseJwtPayloadType(args.handshakeID,homeComB.communityUuid)
          const responseJwt = await encryptAndSign(responseArgs, homeComB.privateJwtKey!, authCom.publicJwtKey!)
          return responseJwt
        }
      }
      return null
    } catch (err) {
      methodLogger.error('invalid jwt token:', err)
      return null
    }
  }
}

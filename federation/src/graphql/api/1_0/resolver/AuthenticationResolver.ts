import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { CommunityHandshakeStateLogic, EncryptedTransferArgs, interpretEncryptedTransferArgs, splitUrlInEndPointAndApiVersion } from 'core'
import {
  CommunityLoggingView,
  CommunityHandshakeStateLoggingView,
  CommunityHandshakeState as DbCommunityHandshakeState,
  CommunityHandshakeStateType,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
  getHomeCommunity,
  findPendingCommunityHandshakeOrFailByOneTimeCode,
  Community as DbCommunity,
  getCommunityByPublicKeyOrFail,
} from 'database'
import { getLogger } from 'log4js'
import { 
  AuthenticationJwtPayloadType, 
  AuthenticationResponseJwtPayloadType, 
  Ed25519PublicKey, 
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
    const argsPublicKey = new Ed25519PublicKey(args.publicKey)
    try {
      const openConnectionJwtPayload = await interpretEncryptedTransferArgs(args) as OpenConnectionJwtPayloadType
      methodLogger.debug('openConnectionJwtPayload', openConnectionJwtPayload)
      if (!openConnectionJwtPayload) {
        throw new Error(`invalid OpenConnection payload of requesting community with publicKey ${argsPublicKey.asHex()}`)
      }
      if (openConnectionJwtPayload.tokentype !== OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE) {
        throw new Error(`invalid tokentype of community with publicKey ${argsPublicKey.asHex()}`)
      }
      if (!openConnectionJwtPayload.url) {
        throw new Error(`invalid url of community with publicKey ${argsPublicKey.asHex()}`)
      }
      methodLogger.debug(`before DbFedCommunity.findOneByOrFail()...`, { publicKey: argsPublicKey.asHex() })
      const fedComA = await DbFedCommunity.findOneByOrFail({ publicKey: argsPublicKey.asBuffer() })
      methodLogger.debug(`after DbFedCommunity.findOneByOrFail()...`, new FederatedCommunityLoggingView(fedComA))
      if (!openConnectionJwtPayload.url.startsWith(fedComA.endPoint)) {
        throw new Error(`invalid url of community with publicKey ${argsPublicKey.asHex()}`)
      }

      // no await to respond immediately and invoke callback-request asynchronously
      void startOpenConnectionCallback(args.handshakeID, argsPublicKey, CONFIG.FEDERATION_API)
      methodLogger.debug('openConnection() successfully initiated callback and returns true immediately...')
      return true
    } catch (err) {
      let errorText = ''
      if (err instanceof Error) {
        errorText = err.message
      } else {
        errorText = String(err)
      }
      methodLogger.error('invalid jwt token:', errorText)
      // no infos to the caller
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
        throw new Error(`invalid OpenConnectionCallback payload of requesting community with publicKey ${args.publicKey}`)
      }
      const { endPoint, apiVersion } = splitUrlInEndPointAndApiVersion(openConnectionCallbackJwtPayload.url)
      methodLogger.debug(`search fedComB per:`, endPoint, apiVersion)
      const fedComB = await DbFedCommunity.findOneBy({ endPoint, apiVersion })
      if (!fedComB) {
        throw new Error(`unknown callback community with url ${openConnectionCallbackJwtPayload.url}`)
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
      let errorText = ''
      if (err instanceof Error) {
        errorText = err.message
      } else {
        errorText = String(err)
      }
      methodLogger.error('invalid jwt token:', errorText)
      // no infos to the caller
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
    let state: DbCommunityHandshakeState | null = null
    const argsPublicKey = new Ed25519PublicKey(args.publicKey)
    try {
      const authArgs = await interpretEncryptedTransferArgs(args) as AuthenticationJwtPayloadType
      methodLogger.debug(`interpreted authentication payload...authArgs:`, authArgs)
      if (!authArgs) {
        throw new Error(`invalid authentication payload of requesting community with publicKey ${argsPublicKey.asHex()}`)
      }
      const validOneTimeCode = uint32Schema.safeParse(Number(authArgs.oneTimeCode))
      if (!validOneTimeCode.success) {
        throw new Error(
          `invalid oneTimeCode: ${authArgs.oneTimeCode} for community with publicKey ${argsPublicKey.asHex()}, expect uint32`
        )
      }

      state = await findPendingCommunityHandshakeOrFailByOneTimeCode(validOneTimeCode.data)
      const stateLogic = new CommunityHandshakeStateLogic(state)
      if (
        (await stateLogic.isTimeoutUpdate()) || 
        state.status !== CommunityHandshakeStateType.START_OPEN_CONNECTION_CALLBACK
      ) {
        throw new Error('No valid pending community handshake found')
      }
      state.status = CommunityHandshakeStateType.SUCCESS
      await state.save()
      
      methodLogger.debug(`search community per oneTimeCode:`, authArgs.oneTimeCode)
      const authCom = await getCommunityByPublicKeyOrFail(argsPublicKey)
      if (authCom) {
        methodLogger.debug('found authCom:', new CommunityLoggingView(authCom))
        const authComPublicKey = new Ed25519PublicKey(authCom.publicKey)
        methodLogger.debug('authCom.publicKey', authComPublicKey.asHex())
        methodLogger.debug('args.publicKey', argsPublicKey.asHex())
        if (!authComPublicKey.isSame(argsPublicKey)) {
          throw new Error(
            `corrupt authentication call detected, oneTimeCode: ${authArgs.oneTimeCode} doesn't belong to caller: ${argsPublicKey.asHex()}`
          )
        }
        const communityUuid = uuidv4Schema.safeParse(authArgs.uuid)
        if (!communityUuid.success) {
          throw new Error(
            `invalid uuid: ${authArgs.uuid} for community with publicKey ${authComPublicKey.asHex()}`
          )
        }
        authCom.communityUuid = communityUuid.data
        authCom.authenticatedAt = new Date()
        await authCom.save()
        methodLogger.debug('update authCom.uuid successfully')    
        
        const homeComB = await getHomeCommunity()
        if (homeComB?.communityUuid) {
          const responseArgs = new AuthenticationResponseJwtPayloadType(args.handshakeID,homeComB.communityUuid)
          const responseJwt = await encryptAndSign(responseArgs, homeComB.privateJwtKey!, authCom.publicJwtKey!)
          return responseJwt
        }
      }
      return null
    } catch (err) {
      let errorString = ''
      if (err instanceof Error) {
        errorString = err.message
      } else {
        errorString = String(err)
      }
      if (state) {
        methodLogger.info(`state: ${new CommunityHandshakeStateLoggingView(state)}`)
        state.status = CommunityHandshakeStateType.FAILED
        state.lastError = errorString
        await state.save()
      }
      methodLogger.error(`failed: ${errorString}`)
      // no infos to the caller
      return null
    }
  }
}

import {
  CommunityHandshakeStateLogic,
  EncryptedTransferArgs,
  interpretEncryptedTransferArgs,
  splitUrlInEndPointAndApiVersion,
} from 'core'
import {
  CommunityHandshakeStateLoggingView,
  CommunityHandshakeStateType,
  CommunityHandshakeState as DbCommunityHandshakeState,
  FederatedCommunity as DbFedCommunity,
  findPendingCommunityHandshakeOrFailByOneTimeCode,
  getCommunityByPublicKeyOrFail,
  getHomeCommunity,
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
  uuidv4Schema,
} from 'shared'
import { Arg, Mutation, Resolver } from 'type-graphql'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { startAuthentication, startOpenConnectionCallback } from '../util/authenticateCommunity'

// TODO: think about the case, when we have a higher api version, which still use this resolver
const apiVersion = '1_0'
const createLogger = (method: string) =>
  getLogger(
    `${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.${apiVersion}.resolver.AuthenticationResolver.${method}`,
  )

@Resolver()
export class AuthenticationResolver {
  @Mutation(() => Boolean)
  async openConnection(
    @Arg('data')
    args: EncryptedTransferArgs,
  ): Promise<boolean> {
    const methodLogger = createLogger('openConnection')
    methodLogger.addContext('handshakeID', args.handshakeID)
    const argsPublicKey = new Ed25519PublicKey(args.publicKey)
    methodLogger.debug(`start via apiVersion=${apiVersion}, public key: ${argsPublicKey.asHex()}`)
    try {
      const openConnectionJwtPayload = (await interpretEncryptedTransferArgs(
        args,
      )) as OpenConnectionJwtPayloadType
      methodLogger.debug(`openConnectionJwtPayload url: ${openConnectionJwtPayload.url}`)
      if (!openConnectionJwtPayload) {
        throw new Error(
          `invalid OpenConnection payload of requesting community with publicKey ${argsPublicKey.asHex()}`,
        )
      }
      if (
        openConnectionJwtPayload.tokentype !== OpenConnectionJwtPayloadType.OPEN_CONNECTION_TYPE
      ) {
        throw new Error(
          `invalid tokentype: ${openConnectionJwtPayload.tokentype} of community with publicKey ${argsPublicKey.asHex()}`,
        )
      }
      if (!openConnectionJwtPayload.url) {
        throw new Error(`invalid url of community with publicKey ${argsPublicKey.asHex()}`)
      }
      // methodLogger.debug(`before DbFedCommunity.findOneByOrFail()...`, { publicKey: argsPublicKey.asHex() })
      const fedComA = await DbFedCommunity.findOneByOrFail({ publicKey: argsPublicKey.asBuffer() })
      // methodLogger.debug(`after DbFedCommunity.findOneByOrFail()...`, new FederatedCommunityLoggingView(fedComA))
      if (!openConnectionJwtPayload.url.startsWith(fedComA.endPoint)) {
        throw new Error(`invalid url of community with publicKey ${argsPublicKey.asHex()}`)
      }
      if (fedComA.apiVersion !== apiVersion) {
        throw new Error(
          `invalid apiVersion: ${fedComA.apiVersion} of community with publicKey ${argsPublicKey.asHex()}`,
        )
      }

      // no await to respond immediately and invoke callback-request asynchronously
      // important: startOpenConnectionCallback must catch all exceptions them self, or server will crash!
      // biome-ignore lint/complexity/noVoid: start it intentionally without waiting for result
      void startOpenConnectionCallback(args.handshakeID, argsPublicKey, fedComA)
      methodLogger.debug(
        'openConnection() successfully initiated callback and returns true immediately...',
      )
      return true
    } catch (err) {
      methodLogger.error('invalid jwt token:', err)
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
    methodLogger.debug(`start via apiVersion=${apiVersion}, public key: ${args.publicKey}`)
    try {
      // decrypt args.url with homeCom.privateJwtKey and verify signing with callbackFedCom.publicKey
      const openConnectionCallbackJwtPayload = (await interpretEncryptedTransferArgs(
        args,
      )) as OpenConnectionCallbackJwtPayloadType
      if (!openConnectionCallbackJwtPayload) {
        throw new Error(
          `invalid OpenConnectionCallback payload of requesting community with publicKey ${args.publicKey}`,
        )
      }
      const { endPoint, apiVersion } = splitUrlInEndPointAndApiVersion(
        openConnectionCallbackJwtPayload.url,
      )
      // methodLogger.debug(`search fedComB per:`, endPoint, apiVersion)
      const fedComB = await DbFedCommunity.findOneBy({ endPoint, apiVersion })
      if (!fedComB) {
        throw new Error(`unknown callback community for ${endPoint}${apiVersion}`)
      }
      methodLogger.debug(
        `found fedComB and start authentication: ${fedComB.endPoint}${fedComB.apiVersion}`,
      )
      // no await to respond immediately and invoke authenticate-request asynchronously
      // biome-ignore lint/complexity/noVoid: start it intentionally without waiting for result
      void startAuthentication(
        args.handshakeID,
        openConnectionCallbackJwtPayload.oneTimeCode,
        fedComB,
      )
      // methodLogger.debug('openConnectionCallback() successfully initiated authentication and returns true immediately...')
      return true
    } catch (err) {
      methodLogger.error('invalid jwt token:', err)
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
    methodLogger.debug(`start via apiVersion=${apiVersion}, public key: ${args.publicKey}`)
    let state: DbCommunityHandshakeState | null = null
    const argsPublicKey = new Ed25519PublicKey(args.publicKey)
    try {
      const authArgs = (await interpretEncryptedTransferArgs(args)) as AuthenticationJwtPayloadType
      // methodLogger.debug(`interpreted authentication payload...authArgs:`, authArgs)
      if (!authArgs) {
        methodLogger.debug(`interpretEncryptedTransferArgs was called with`, args)
        throw new Error(
          `invalid authentication payload of requesting community with publicKey ${argsPublicKey.asHex()}`,
        )
      }
      const validOneTimeCode = uint32Schema.safeParse(Number(authArgs.oneTimeCode))
      if (!validOneTimeCode.success) {
        throw new Error(
          `invalid oneTimeCode: ${authArgs.oneTimeCode} for community with publicKey ${argsPublicKey.asHex()}, expect uint32`,
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
      methodLogger.debug('[SUCCESS] community handshake state updated')

      // methodLogger.debug(`search community per oneTimeCode:`, authArgs.oneTimeCode)
      const authCom = await getCommunityByPublicKeyOrFail(argsPublicKey)
      if (authCom) {
        methodLogger.debug(`found authCom ${authCom.name}`)
        const authComPublicKey = new Ed25519PublicKey(authCom.publicKey)
        // methodLogger.debug('authCom.publicKey', authComPublicKey.asHex())
        // methodLogger.debug('args.publicKey', argsPublicKey.asHex())
        if (!authComPublicKey.isSame(argsPublicKey)) {
          throw new Error(
            `corrupt authentication call detected, oneTimeCode: ${authArgs.oneTimeCode} doesn't belong to caller: ${argsPublicKey.asHex()}`,
          )
        }
        const communityUuid = uuidv4Schema.safeParse(authArgs.uuid)
        if (!communityUuid.success) {
          throw new Error(
            `invalid uuid: ${authArgs.uuid} for community with publicKey ${authComPublicKey.asHex()}`,
          )
        }
        authCom.communityUuid = communityUuid.data
        authCom.authenticatedAt = new Date()
        await authCom.save()
        methodLogger.debug(
          `update authCom.uuid successfully with ${authCom.communityUuid} at ${authCom.authenticatedAt}`,
        )

        const homeComB = await getHomeCommunity()
        if (homeComB?.communityUuid) {
          const responseArgs = new AuthenticationResponseJwtPayloadType(
            args.handshakeID,
            homeComB.communityUuid,
          )
          const responseJwt = await encryptAndSign(
            responseArgs,
            homeComB.privateJwtKey!,
            authCom.publicJwtKey!,
          )
          return responseJwt
        }
      } else {
        throw new Error(`community with publicKey ${argsPublicKey.asHex()} not found`)
      }
      return null
    } catch (err) {
      if (state) {
        try {
          state.status = CommunityHandshakeStateType.FAILED
          state.lastError = String(err)
          await state.save()
        } catch (err) {
          methodLogger.error(
            `failed to save state`,
            new CommunityHandshakeStateLoggingView(state),
            err,
          )
        }
      }
      methodLogger.error(`failed`, err)
      // no infos to the caller
      return null
    }
  }
}

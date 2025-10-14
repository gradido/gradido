import { CommunityHandshakeStateLogic, CommunityLogic, EncryptedTransferArgs, ensureUrlEndsWithSlash } from 'core'
import {
  CommunityHandshakeStateLoggingView,
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
  findPendingCommunityHandshake,
  getCommunityWithFederatedCommunityWithApiOrFail,
  getHomeCommunity,
  getHomeCommunityWithFederatedCommunityOrFail,
} from 'database'
import { getLogger, Logger } from 'log4js'

import { AuthenticationClientFactory } from '@/client/AuthenticationClientFactory'
import { randombytes_random } from 'sodium-native'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/client/1_0/AuthenticationClient'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { 
  AuthenticationJwtPayloadType, 
  AuthenticationResponseJwtPayloadType, 
  Ed25519PublicKey, 
  encryptAndSign, 
  OpenConnectionCallbackJwtPayloadType, 
  uuidv4Schema, 
  verifyAndDecrypt 
} from 'shared'
import { CommunityHandshakeState as DbCommunityHandshakeState, CommunityHandshakeStateType } from 'database'

const createLogger = (method: string  ) => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.util.authenticateCommunity.${method}`)

async function errorState(
  error: string,
  methodLogger: Logger,
  state: DbCommunityHandshakeState, 
): Promise<DbCommunityHandshakeState> {
  methodLogger.error(error)
  state.status = CommunityHandshakeStateType.FAILED
  state.lastError = error
  return state.save()
}

export async function startOpenConnectionCallback(
  handshakeID: string,
  publicKey: Ed25519PublicKey,
  api: string,
): Promise<void> {
  const methodLogger = createLogger('startOpenConnectionCallback')
  methodLogger.addContext('handshakeID', handshakeID)
  methodLogger.debug(`Authentication: startOpenConnectionCallback() with:`, {
    publicKey: publicKey.asHex(),
  })
  const pendingState = await findPendingCommunityHandshake(publicKey, api)
  if (pendingState) {
    const stateLogic = new CommunityHandshakeStateLogic(pendingState)
    // retry on timeout or failure
    if (!(await stateLogic.isTimeoutUpdate())) {
      // authentication with community and api version is still in progress and it is not timeout yet
      methodLogger.debug('existingState, so we exit here', new CommunityHandshakeStateLoggingView(pendingState))
      return
    }
  }
  const state = new DbCommunityHandshakeState()
  try {
    const [homeComB, comA] = await Promise.all([
      getHomeCommunityWithFederatedCommunityOrFail(api),
      getCommunityWithFederatedCommunityWithApiOrFail(publicKey, api),
    ])
    // load helpers
    const homeComBLogic = new CommunityLogic(homeComB)
    const comALogic = new CommunityLogic(comA)
    // get federated communities with correct api version
    const homeFedComB = homeComBLogic.getFederatedCommunityWithApiOrFail(api)    
    const fedComA = comALogic.getFederatedCommunityWithApiOrFail(api)
    
    // TODO: make sure it is unique
    const oneTimeCode = randombytes_random()
    const oneTimeCodeString = oneTimeCode.toString()
    
    state.publicKey = publicKey.asBuffer()
    state.apiVersion = api
    state.status = CommunityHandshakeStateType.START_OPEN_CONNECTION_CALLBACK
    state.handshakeId = parseInt(handshakeID)
    state.oneTimeCode = oneTimeCode
    await state.save()
    methodLogger.debug(
      `Authentication: store oneTimeCode in CommunityHandshakeState:`,
      new CommunityHandshakeStateLoggingView(state),
    )

    const client = AuthenticationClientFactory.getInstance(fedComA)

    if (client instanceof V1_0_AuthenticationClient) {
      const url = ensureUrlEndsWithSlash(homeFedComB.endPoint) + homeFedComB.apiVersion

      const callbackArgs = new OpenConnectionCallbackJwtPayloadType(handshakeID, oneTimeCodeString, url)
      methodLogger.debug(`Authentication: start openConnectionCallback with args:`, callbackArgs)
      // encrypt callbackArgs with requestedCom.publicJwtKey and sign it with homeCom.privateJwtKey
      const jwt = await encryptAndSign(callbackArgs, homeComB.privateJwtKey!, comA.publicJwtKey!)
      const args = new EncryptedTransferArgs()
      args.publicKey = new Ed25519PublicKey(homeComB.publicKey).asHex()
      args.jwt = jwt
      args.handshakeID = handshakeID
      const result = await client.openConnectionCallback(args)
      if (result) {
        methodLogger.debug(`startOpenConnectionCallback() successful: ${jwt}`)
      } else {
        methodLogger.debug(`jwt: ${jwt}`)
        await errorState('startOpenConnectionCallback() failed', methodLogger, state)
      }
    }
  } catch (err) {
    let errorString: string = ''
    if (err instanceof Error) {
      errorString = err.message
    } else {
      errorString = String(err)
    }
    await errorState(`error in startOpenConnectionCallback: ${errorString}`, methodLogger, state)
  }
}

export async function startAuthentication(
  handshakeID: string,
  oneTimeCode: string,
  fedComB: DbFedCommunity,
): Promise<void> {
  const methodLogger = createLogger('startAuthentication')
  methodLogger.addContext('handshakeID', handshakeID)
  methodLogger.debug(`startAuthentication()...`, {
    oneTimeCode,
    fedComB: new FederatedCommunityLoggingView(fedComB),
  })
  let state: DbCommunityHandshakeState | null = null
  const fedComBPublicKey = new Ed25519PublicKey(fedComB.publicKey)
  try {
    const homeComA = await getHomeCommunity()
    const comB = await DbCommunity.findOneByOrFail({
      foreign: true,
      publicKey: fedComBPublicKey.asBuffer(),
    })
    if (!comB.publicJwtKey) {
      throw new Error('Public JWT key still not exist for foreign community')
    }
    state = await findPendingCommunityHandshake(fedComBPublicKey, fedComB.apiVersion)
    if (!state) {
      throw new Error('No pending community handshake found')
    }
    const stateLogic = new CommunityHandshakeStateLogic(state)
    if (
      (await stateLogic.isTimeoutUpdate()) || 
      state.status !== CommunityHandshakeStateType.START_COMMUNITY_AUTHENTICATION
    ) {
      methodLogger.debug('invalid state', new CommunityHandshakeStateLoggingView(state))
      throw new Error('No valid pending community handshake found')
    }
    state.status = CommunityHandshakeStateType.START_AUTHENTICATION
    await state.save()

    const client = AuthenticationClientFactory.getInstance(fedComB)

    if (client instanceof V1_0_AuthenticationClient) {
      const authenticationArgs = new AuthenticationJwtPayloadType(handshakeID, oneTimeCode, homeComA!.communityUuid!)
      // encrypt authenticationArgs.uuid with fedComB.publicJwtKey and sign it with homeCom.privateJwtKey
      const jwt = await encryptAndSign(authenticationArgs, homeComA!.privateJwtKey!, comB.publicJwtKey!)
      const args = new EncryptedTransferArgs()
      args.publicKey = new Ed25519PublicKey(homeComA!.publicKey).asHex()
      args.jwt = jwt
      args.handshakeID = handshakeID
      methodLogger.debug(`invoke authenticate() with:`, args)
      const responseJwt = await client.authenticate(args)
      methodLogger.debug(`response of authenticate():`, responseJwt)

      if (responseJwt !== null) {
        const payload = await verifyAndDecrypt(handshakeID, responseJwt, homeComA!.privateJwtKey!, comB.publicJwtKey!) as AuthenticationResponseJwtPayloadType
        methodLogger.debug(
          `received payload from authenticate ComB:`,
          payload,
          new FederatedCommunityLoggingView(fedComB),
        )
        if (payload.tokentype !== AuthenticationResponseJwtPayloadType.AUTHENTICATION_RESPONSE_TYPE) {
          throw new Error(`Invalid tokentype in authenticate-response of community with publicKey ${fedComBPublicKey.asHex()}`)
        }
        if (!uuidv4Schema.safeParse(payload.uuid).success) {
          throw new Error(`Invalid uuid in authenticate-response of community with publicKey ${fedComBPublicKey.asHex()}`)
        }
        comB.communityUuid = payload.uuid
        comB.authenticatedAt = new Date()
        await DbCommunity.save(comB)        
        state.status = CommunityHandshakeStateType.SUCCESS
        await state.save()
        methodLogger.debug('Community Authentication successful:', new CommunityLoggingView(comB))
      } else {
        state.status = CommunityHandshakeStateType.FAILED
        state.lastError = 'Community Authentication failed, empty response'
        await state.save()
        methodLogger.error('Community Authentication failed:', authenticationArgs)
      }
    }
  } catch (err) {
    let errorString: string = ''
    if (err instanceof Error) {
      errorString = err.message
    } else {
      errorString = String(err)
    }
    if (state) {
      state.status = CommunityHandshakeStateType.FAILED
      state.lastError = errorString
      await state.save()
    }
    methodLogger.error('error in startAuthentication:', errorString)
  }
}

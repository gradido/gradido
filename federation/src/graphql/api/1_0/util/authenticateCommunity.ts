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
import { validate as validateUUID, version as versionUUID } from 'uuid'

import { AuthenticationClientFactory } from '@/client/AuthenticationClientFactory'
import { randombytes_random } from 'sodium-native'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/client/1_0/AuthenticationClient'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { 
  AuthenticationJwtPayloadType, 
  AuthenticationResponseJwtPayloadType, 
  encryptAndSign, 
  OpenConnectionCallbackJwtPayloadType, 
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
  publicKey: string,
  api: string,
): Promise<void> {
  const methodLogger = createLogger('startOpenConnectionCallback')
  methodLogger.addContext('handshakeID', handshakeID)
  methodLogger.debug(`Authentication: startOpenConnectionCallback() with:`, {
    publicKey,
  })
  const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const pendingState = await findPendingCommunityHandshake(publicKeyBuffer, api, false)
  if (pendingState) {
    const stateLogic = new CommunityHandshakeStateLogic(pendingState)
    // retry on timeout or failure
    if (!await stateLogic.isTimeoutUpdate()) {
      // authentication with community and api version is still in progress and it is not timeout yet
      methodLogger.debug('existingState', new CommunityHandshakeStateLoggingView(pendingState))
      return
    }
  }
  let stateSaveResolver: Promise<DbCommunityHandshakeState> | undefined = undefined
  const state = new DbCommunityHandshakeState()
  try {
    const [homeComB, comA] = await Promise.all([
      getHomeCommunityWithFederatedCommunityOrFail(api),
      getCommunityWithFederatedCommunityWithApiOrFail(publicKeyBuffer, api),
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
    
    state.publicKey = publicKeyBuffer
    state.apiVersion = api
    state.status = CommunityHandshakeStateType.START_OPEN_CONNECTION_CALLBACK
    state.handshakeId = parseInt(handshakeID)
    state.oneTimeCode = oneTimeCode
    stateSaveResolver = state.save()
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
      args.publicKey = homeComB.publicKey.toString('hex')
      args.jwt = jwt
      args.handshakeID = handshakeID
      await stateSaveResolver
      const result = await client.openConnectionCallback(args)
      if (result) {
        methodLogger.debug(`startOpenConnectionCallback() successful: ${jwt}`)
      } else {
        methodLogger.debug(`jwt: ${jwt}`)
        stateSaveResolver = errorState('startOpenConnectionCallback() failed', methodLogger, state)
      }
    }
  } catch (err) {
    let errorString: string = ''
    if (err instanceof Error) {
      errorString = err.message
    } else {
      errorString = String(err)
    }
    stateSaveResolver = errorState(`error in startOpenConnectionCallback: ${errorString}`, methodLogger, state)
  } finally {
    if (stateSaveResolver) {
      await stateSaveResolver
    }
  }
}

export async function startAuthentication(
  handshakeID: string,
  oneTimeCode: string,
  fedComB: DbFedCommunity,
): Promise<void> {
  const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.util.authenticateCommunity.startAuthentication`)
  methodLogger.addContext('handshakeID', handshakeID)
  methodLogger.debug(`startAuthentication()...`, {
    oneTimeCode,
    fedComB: new FederatedCommunityLoggingView(fedComB),
  })
  try {
    const homeComA = await getHomeCommunity()
    const comB = await DbCommunity.findOneByOrFail({
      foreign: true,
      publicKey: fedComB.publicKey,
    })
    if (!comB.publicJwtKey) {
      throw new Error('Public JWT key still not exist for foreign community')
    }

    const client = AuthenticationClientFactory.getInstance(fedComB)

    if (client instanceof V1_0_AuthenticationClient) {
      const authenticationArgs = new AuthenticationJwtPayloadType(handshakeID, oneTimeCode, homeComA!.communityUuid!)
      // encrypt authenticationArgs.uuid with fedComB.publicJwtKey and sign it with homeCom.privateJwtKey
      const jwt = await encryptAndSign(authenticationArgs, homeComA!.privateJwtKey!, comB.publicJwtKey!)
      const args = new EncryptedTransferArgs()
      args.publicKey = homeComA!.publicKey.toString('hex')
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
          const errmsg = `Invalid tokentype in authenticate-response of community with publicKey` + comB.publicKey
          methodLogger.error(errmsg)
          methodLogger.removeContext('handshakeID')
          throw new Error(errmsg)
        }
        if (!payload.uuid || !validateUUID(payload.uuid) || versionUUID(payload.uuid) !== 4) {
          const errmsg = `Invalid uuid in authenticate-response of community with publicKey` + comB.publicKey
          methodLogger.error(errmsg)
          methodLogger.removeContext('handshakeID')
          throw new Error(errmsg)
        }
        comB.communityUuid = payload.uuid
        comB.authenticatedAt = new Date()
        await DbCommunity.save(comB)
        methodLogger.debug('Community Authentication successful:', new CommunityLoggingView(comB))
      } else {
        methodLogger.error('Community Authentication failed:', authenticationArgs)
      }
    }
  } catch (err) {
    methodLogger.error('error in startAuthentication:', err)
  }
  methodLogger.removeContext('handshakeID')
}

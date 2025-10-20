import { CommunityHandshakeStateLogic, EncryptedTransferArgs, ensureUrlEndsWithSlash } from 'core'
import {
  CommunityHandshakeStateLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  findPendingCommunityHandshake,
  getCommunityByPublicKeyOrFail,
  getHomeCommunity,
  getHomeCommunityWithFederatedCommunityOrFail,
} from 'database'
import { getLogger } from 'log4js'

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
import { getFederatedCommunityWithApiOrFail } from 'core'

const createLogger = (method: string  ) => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.util.authenticateCommunity.${method}`)

export async function startOpenConnectionCallback(
  handshakeID: string,
  publicKey: Ed25519PublicKey,
  fedComA: DbFedCommunity,
): Promise<void> {
  const methodLogger = createLogger('startOpenConnectionCallback')
  methodLogger.addContext('handshakeID', handshakeID)
  methodLogger.debug(`start`)
  const api = fedComA.apiVersion

  let state: DbCommunityHandshakeState | null = null
  try {
    const pendingState = await findPendingCommunityHandshake(publicKey, api, CommunityHandshakeStateType.START_OPEN_CONNECTION_CALLBACK)
    if (pendingState) {
      const stateLogic = new CommunityHandshakeStateLogic(pendingState)
      // retry on timeout or failure
      if (!(await stateLogic.isTimeoutUpdate())) {
        // authentication with community and api version is still in progress and it is not timeout yet
        methodLogger.debug('existingState, so we exit here', new CommunityHandshakeStateLoggingView(pendingState))
        return
      }
    }
    // load comA and comB parallel
    // load with joined federated community of given api version
    const [homeComB, comA] = await Promise.all([
      getHomeCommunityWithFederatedCommunityOrFail(api),
      getCommunityByPublicKeyOrFail(publicKey),
    ])
    // get federated communities with correct api version
    // simply check and extract federated community from community of given api version or throw error if not found
    const homeFedComB = getFederatedCommunityWithApiOrFail(homeComB, api)    
    
    // TODO: make sure it is unique
    const oneTimeCode = randombytes_random()
    const oneTimeCodeString = oneTimeCode.toString()
    
    // Create new community handshake state
    state = new DbCommunityHandshakeState()
    state.publicKey = publicKey.asBuffer()
    state.apiVersion = api
    state.status = CommunityHandshakeStateType.START_OPEN_CONNECTION_CALLBACK
    state.handshakeId = parseInt(handshakeID)
    state.oneTimeCode = oneTimeCode
    state = await state.save()
    methodLogger.debug('[START_OPEN_CONNECTION_CALLBACK] community handshake state created')

    const client = AuthenticationClientFactory.getInstance(fedComA)

    if (client instanceof V1_0_AuthenticationClient) {
      const url = ensureUrlEndsWithSlash(homeFedComB.endPoint) + homeFedComB.apiVersion

      const callbackArgs = new OpenConnectionCallbackJwtPayloadType(handshakeID, oneTimeCodeString, url)
      // methodLogger.debug(`Authentication: start openConnectionCallback with args:`, callbackArgs)
      // encrypt callbackArgs with requestedCom.publicJwtKey and sign it with homeCom.privateJwtKey
      const jwt = await encryptAndSign(callbackArgs, homeComB.privateJwtKey!, comA.publicJwtKey!)
      const args = new EncryptedTransferArgs()
      args.publicKey = new Ed25519PublicKey(homeComB.publicKey).asHex()
      args.jwt = jwt
      args.handshakeID = handshakeID
      methodLogger.debug(`invoke openConnectionCallback(), oneTimeCode: ${oneTimeCodeString}`)
      const result = await client.openConnectionCallback(args)
      if (result) {
        methodLogger.debug(`startOpenConnectionCallback() successful`)
      } else {
        methodLogger.debug(`jwt: ${jwt}`)
        const errorString = 'startOpenConnectionCallback() failed'
        methodLogger.error(errorString)
        state.status = CommunityHandshakeStateType.FAILED
        state.lastError = errorString
        state = await state.save()
      }
    }
  } catch (err) {
    methodLogger.error('error in startOpenConnectionCallback', err)
    if (state) {
      try {
        state.status = CommunityHandshakeStateType.FAILED
        state.lastError = String(err)
        state = await state.save()
      } catch(e) {
        methodLogger.error('error on saving CommunityHandshakeState', e)
      }
    }
  }
}

export async function startAuthentication(
  handshakeID: string,
  oneTimeCode: string,
  fedComB: DbFedCommunity,
): Promise<void> {
  const methodLogger = createLogger('startAuthentication')
  methodLogger.addContext('handshakeID', handshakeID)
  methodLogger.debug(`startAuthentication()... oneTimeCode: ${oneTimeCode}`)
  let state: DbCommunityHandshakeState | null = null
  try {
    const fedComBPublicKey = new Ed25519PublicKey(fedComB.publicKey)
    const homeComA = await getHomeCommunity()
    const comB = await DbCommunity.findOneByOrFail({
      foreign: true,
      publicKey: fedComBPublicKey.asBuffer(),
    })
    if (!comB.publicJwtKey) {
      throw new Error('Public JWT key still not exist for foreign community')
    }
    state = await findPendingCommunityHandshake(fedComBPublicKey, fedComB.apiVersion, CommunityHandshakeStateType.START_COMMUNITY_AUTHENTICATION)
    if (!state) {
      throw new Error('No pending community handshake found')
    }
    const stateLogic = new CommunityHandshakeStateLogic(state)
    if ((await stateLogic.isTimeoutUpdate())) {
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
      methodLogger.debug(`invoke authenticate(), publicKey: ${args.publicKey}`)
      const responseJwt = await client.authenticate(args)
      // methodLogger.debug(`response of authenticate():`, responseJwt)

      if (responseJwt !== null) {
        const payload = await verifyAndDecrypt(handshakeID, responseJwt, homeComA!.privateJwtKey!, comB.publicJwtKey!) as AuthenticationResponseJwtPayloadType
        /*methodLogger.debug(
          `received payload from authenticate ComB:`,
          payload,
          new FederatedCommunityLoggingView(fedComB),
        )*/
        if (payload.tokentype !== AuthenticationResponseJwtPayloadType.AUTHENTICATION_RESPONSE_TYPE) {
          throw new Error(`Invalid tokentype in authenticate-response of community with publicKey ${fedComBPublicKey.asHex()}`)
        }
        const parsedUuidv4 = uuidv4Schema.safeParse(payload.uuid)
        if (!parsedUuidv4.success) {
          throw new Error(`Invalid uuid in authenticate-response of community with publicKey ${fedComBPublicKey.asHex()}`)
        }
        methodLogger.debug('received uuid from authenticate ComB:', parsedUuidv4.data)
        comB.communityUuid = parsedUuidv4.data
        comB.authenticatedAt = new Date()
        await DbCommunity.save(comB)        
        state.status = CommunityHandshakeStateType.SUCCESS
        await state.save()
        methodLogger.debug('[SUCCESS] community handshake state updated')
        const endTime = new Date()
        const duration = endTime.getTime() - state.createdAt.getTime()
        methodLogger.debug(`Community Authentication successful in ${duration} ms`)
      } else {
        state.status = CommunityHandshakeStateType.FAILED
        state.lastError = 'Community Authentication failed, empty response'
        await state.save()
        methodLogger.error('Community Authentication failed:', authenticationArgs)
      }
    }
  } catch (err) {
    methodLogger.error('error in startAuthentication:', err)
    if (state) {
      try {
        state.status = CommunityHandshakeStateType.FAILED
        state.lastError = String(err)
        await state.save()
      } catch(e) {
        methodLogger.error('error on saving CommunityHandshakeState', e)
      }
    }
    
  }
}

import { 
  CommunityHandshakeState as DbCommunityHandshakeState,
  CommunityHandshakeStateLoggingView, 
  CommunityLoggingView, 
  FederatedCommunity as DbFederatedCommunity, 
  FederatedCommunityLoggingView, 
  findPendingCommunityHandshake, 
  getHomeCommunityWithFederatedCommunityOrFail,
  CommunityHandshakeStateType,
  getCommunityByPublicKeyOrFail
} from 'database'
import { randombytes_random } from 'sodium-native'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/federation/client/1_0/AuthenticationClient'
import { ensureUrlEndsWithSlash } from 'core'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { communityAuthenticatedSchema, encryptAndSign, OpenConnectionJwtPayloadType } from 'shared'
import { getLogger } from 'log4js'
import { AuthenticationClientFactory } from './client/AuthenticationClientFactory'
import { EncryptedTransferArgs } from 'core'
import { CommunityHandshakeStateLogic } from 'core'
import { CommunityLogic } from 'core'
import { Ed25519PublicKey } from 'shared'

const createLogger = (functionName: string) => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.authenticateCommunities.${functionName}`)

export async function startCommunityAuthentication(
  fedComB: DbFederatedCommunity,
): Promise<void> {
  const methodLogger = createLogger('startCommunityAuthentication')
  const handshakeID = randombytes_random().toString()
  methodLogger.addContext('handshakeID', handshakeID)
  methodLogger.debug(`startCommunityAuthentication()...`, {
    fedComB: new FederatedCommunityLoggingView(fedComB),
  })
  const homeComA = await getHomeCommunityWithFederatedCommunityOrFail(fedComB.apiVersion)
  methodLogger.debug('homeComA', new CommunityLoggingView(homeComA))
  const homeComALogic = new CommunityLogic(homeComA)
  const homeFedComA = homeComALogic.getFederatedCommunityWithApiOrFail(fedComB.apiVersion)
  const fedComBPublicKey = new Ed25519PublicKey(fedComB.publicKey)
  const comB = await getCommunityByPublicKeyOrFail(fedComBPublicKey)
  methodLogger.debug('started with comB:', new CommunityLoggingView(comB))
  // check if communityUuid is not a valid v4Uuid
  
  // communityAuthenticatedSchema.safeParse return true 
  // - if communityUuid is a valid v4Uuid and 
  // - if authenticatedAt is a valid date
  if (communityAuthenticatedSchema.safeParse(comB).success) {
    methodLogger.debug(`comB.communityUuid is already a valid v4Uuid ${ comB.communityUuid || 'null' } and was authenticated at ${ comB.authenticatedAt || 'null'}`)
    return
  }
  methodLogger.debug('comB.uuid is null or is a not valid v4Uuid...', 
    comB.communityUuid || 'null', comB.authenticatedAt || 'null'
  )

  // check if a authentication is already in progress
  const existingState = await findPendingCommunityHandshake(fedComBPublicKey, fedComB.apiVersion, false)
  if (existingState) {
    const stateLogic = new CommunityHandshakeStateLogic(existingState)
    // retry on timeout or failure
    if (!await stateLogic.isTimeoutUpdate()) {
      // authentication with community and api version is still in progress and it is not timeout yet
      methodLogger.debug('existingState, so we exit here', new CommunityHandshakeStateLoggingView(existingState))
      return
    }
  }
  
  const client = AuthenticationClientFactory.getInstance(fedComB)

  if (client instanceof V1_0_AuthenticationClient) {
    if (!comB.publicJwtKey) {
      throw new Error(`Public JWT key still not exist for comB ${comB.name}`)
    }
    const state = new DbCommunityHandshakeState()
    state.publicKey = fedComBPublicKey.asBuffer()
    state.apiVersion = fedComB.apiVersion
    state.status = CommunityHandshakeStateType.START_COMMUNITY_AUTHENTICATION
    state.handshakeId = parseInt(handshakeID)
    const stateSaveResolver = state.save()

    //create JWT with url in payload encrypted by foreignCom.publicJwtKey and signed with homeCom.privateJwtKey
    const payload = new OpenConnectionJwtPayloadType(handshakeID,
      ensureUrlEndsWithSlash(homeFedComA.endPoint).concat(homeFedComA.apiVersion),
    )
    methodLogger.debug('payload', payload)
    const jws = await encryptAndSign(payload, homeComA!.privateJwtKey!, comB.publicJwtKey!)
    methodLogger.debug('jws', jws)
    // prepare the args for the client invocation
    const args = new EncryptedTransferArgs()
    const homeComAPublicKey = new Ed25519PublicKey(homeComA!.publicKey)
    args.publicKey = homeComAPublicKey.asHex()
    args.jwt = jws
    args.handshakeID = handshakeID
    await stateSaveResolver
    methodLogger.debug('before client.openConnection() args:', args)
    const result = await client.openConnection(args)
    if (result) {
      methodLogger.info(`successful initiated at community:`, fedComB.endPoint)
    } else {
      const errorMsg = `can't initiate at community: ${fedComB.endPoint}`
      methodLogger.error(errorMsg)
      state.status = CommunityHandshakeStateType.FAILED
      state.lastError = errorMsg
    }
    await state.save()
  }
}

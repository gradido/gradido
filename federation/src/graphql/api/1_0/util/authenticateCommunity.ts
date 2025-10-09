import { EncryptedTransferArgs } from 'core'
import {
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { validate as validateUUID, version as versionUUID } from 'uuid'

import { AuthenticationClientFactory } from '@/client/AuthenticationClientFactory'
import { randombytes_random } from 'sodium-native'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/client/1_0/AuthenticationClient'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { AuthenticationJwtPayloadType, AuthenticationResponseJwtPayloadType, encryptAndSign, OpenConnectionCallbackJwtPayloadType, uint32Schema, uuidv4Schema, verifyAndDecrypt } from 'shared'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.util.authenticateCommunity`)

export async function startOpenConnectionCallback(
  handshakeID: string,
  publicKey: string,
  api: string,
): Promise<void> {
  const methodLogger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.util.authenticateCommunity.startOpenConnectionCallback`)
  methodLogger.addContext('handshakeID', handshakeID)
  methodLogger.debug(`Authentication: startOpenConnectionCallback() with:`, {
    publicKey,
  })
  try {
    const homeComB = await getHomeCommunity()
    const homeFedComB = await DbFedCommunity.findOneByOrFail({
      foreign: false,
      apiVersion: api,
    })
    const comA = await DbCommunity.findOneByOrFail({ publicKey: Buffer.from(publicKey, 'hex') })
    const fedComA = await DbFedCommunity.findOneByOrFail({
      foreign: true,
      apiVersion: api,
      publicKey: comA.publicKey,
    })
    // store oneTimeCode in requestedCom.community_uuid as authenticate-request-identifier
    // prevent overwriting valid UUID with oneTimeCode, because this request could be initiated at any time from federated community
    if (uuidv4Schema.safeParse(comA.communityUuid).success) {
      methodLogger.debug('Community UUID is already a valid UUID')
      return
    } else if (uint32Schema.safeParse(Number(comA.communityUuid)).success) {
      methodLogger.debug('Community UUID is still in authentication...oneTimeCode=', comA.communityUuid)
      return
    }
    // TODO: make sure it is unique
    const oneTimeCode = randombytes_random().toString()
    comA.communityUuid = oneTimeCode
    await DbCommunity.save(comA)
    methodLogger.debug(
      `Authentication: stored oneTimeCode in requestedCom:`,
      new CommunityLoggingView(comA),
    )

    const client = AuthenticationClientFactory.getInstance(fedComA)

    if (client instanceof V1_0_AuthenticationClient) {
      const url = homeFedComB.endPoint.endsWith('/')
        ? homeFedComB.endPoint + homeFedComB.apiVersion
        : homeFedComB.endPoint + '/' + homeFedComB.apiVersion

      const callbackArgs = new OpenConnectionCallbackJwtPayloadType(handshakeID, oneTimeCode, url)
      methodLogger.debug(`Authentication: start openConnectionCallback with args:`, callbackArgs)
      // encrypt callbackArgs with requestedCom.publicJwtKey and sign it with homeCom.privateJwtKey
      const jwt = await encryptAndSign(callbackArgs, homeComB!.privateJwtKey!, comA.publicJwtKey!)
      const args = new EncryptedTransferArgs()
      args.publicKey = homeComB!.publicKey.toString('hex')
      args.jwt = jwt
      args.handshakeID = handshakeID
      const result = await client.openConnectionCallback(args)
      if (result) {
        methodLogger.debug('startOpenConnectionCallback() successful:', jwt)
      } else {
        methodLogger.error('startOpenConnectionCallback() failed:', jwt)
      }
    }
  } catch (err) {
    methodLogger.error('error in startOpenConnectionCallback:', err)
  }
  methodLogger.removeContext('handshakeID')
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

import {
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { validate as validateUUID, version as versionUUID } from 'uuid'
import { EncryptedTransferArgs } from 'core/src/graphql/model/EncryptedTransferArgs'

import { AuthenticationClientFactory } from '@/client/AuthenticationClientFactory'
import { randombytes_random } from 'sodium-native'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/client/1_0/AuthenticationClient'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { encryptAndSign, verifyAndDecrypt } from 'core/src/auth/jwt/JWT'
import { OpenConnectionCallbackJwtPayloadType } from 'core/src/auth/jwt/payloadtypes/OpenConnectionCallbackJwtPayloadType'
import { AuthenticationJwtPayloadType } from 'core/src/auth/jwt/payloadtypes/AuthenticationJwtPayloadType'
import { AuthenticationResponseJwtPayloadType } from 'core/src/auth/jwt/payloadtypes/AuthenticationResponseJwtPayloadType'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.util.authenticateCommunity`)

export async function startOpenConnectionCallback(
  publicKey: string,
  api: string,
): Promise<void> {
  logger.debug(`Authentication: startOpenConnectionCallback() with:`, {
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
    const oneTimeCode = randombytes_random().toString()
    // store oneTimeCode in requestedCom.community_uuid as authenticate-request-identifier
    comA.communityUuid = oneTimeCode
    await DbCommunity.save(comA)
    logger.debug(
      `Authentication: stored oneTimeCode in requestedCom:`,
      new CommunityLoggingView(comA),
    )

    const client = AuthenticationClientFactory.getInstance(fedComA)

    if (client instanceof V1_0_AuthenticationClient) {
      const url = homeFedComB.endPoint.endsWith('/')
        ? homeFedComB.endPoint + homeFedComB.apiVersion
        : homeFedComB.endPoint + '/' + homeFedComB.apiVersion

      const callbackArgs = new OpenConnectionCallbackJwtPayloadType(oneTimeCode, url)
      logger.debug(`Authentication: start openConnectionCallback with args:`, callbackArgs)
      // encrypt callbackArgs with requestedCom.publicJwtKey and sign it with homeCom.privateJwtKey
      const jwt = await encryptAndSign(callbackArgs, homeComB!.privateJwtKey!, comA.publicJwtKey!)
      const args = new EncryptedTransferArgs()
      args.publicKey = comA.publicKey.toString('hex')
      args.jwt = jwt
      if (await client.openConnectionCallback(args)) {
        logger.debug('startOpenConnectionCallback() successful:', jwt)
      } else {
        logger.error('startOpenConnectionCallback() failed:', jwt)
      }
    }
  } catch (err) {
    logger.error('error in startOpenConnectionCallback:', err)
  }
}

export async function startAuthentication(
  oneTimeCode: string,
  fedComB: DbFedCommunity,
): Promise<void> {
  logger.debug(`startAuthentication()...`, {
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
      const authenticationArgs = new AuthenticationJwtPayloadType(oneTimeCode, homeComA!.communityUuid!)
      // encrypt authenticationArgs.uuid with fedComB.publicJwtKey and sign it with homeCom.privateJwtKey
      const jwt = await encryptAndSign(authenticationArgs, homeComA!.privateJwtKey!, comB.publicJwtKey!)
      const args = new EncryptedTransferArgs()
      args.publicKey = comB.publicKey.toString('hex')
      args.jwt = jwt
      logger.debug(`invoke authenticate() with:`, args)
      const responseJwt = await client.authenticate(args)
      logger.debug(`response of authenticate():`, responseJwt)
      if (responseJwt !== null) {
        const payload = await verifyAndDecrypt(responseJwt, homeComA!.privateJwtKey!, comB.publicJwtKey!) as AuthenticationResponseJwtPayloadType
        logger.debug(
          `received payload from authenticate ComB:`,
          payload,
          new FederatedCommunityLoggingView(fedComB),
        )
        if (payload.tokentype !== AuthenticationResponseJwtPayloadType.AUTHENTICATION_RESPONSE_TYPE) {
          const errmsg = `Invalid tokentype in authenticate-response of community with publicKey` + comB.publicKey
          logger.error(errmsg)
          throw new Error(errmsg)
        }
        if (!payload.uuid || !validateUUID(payload.uuid) || versionUUID(payload.uuid) !== 4) {
          const errmsg = `Invalid uuid in authenticate-response of community with publicKey` + comB.publicKey
          logger.error(errmsg)
          throw new Error(errmsg)
        }
        comB.communityUuid = payload.uuid
        comB.authenticatedAt = new Date()
        await DbCommunity.save(comB)
        logger.debug('Community Authentication successful:', new CommunityLoggingView(comB))
      } else {
        logger.error('Community Authentication failed:', authenticationArgs)
      }
    }
  } catch (err) {
    logger.error('error in startAuthentication:', err)
  }
}

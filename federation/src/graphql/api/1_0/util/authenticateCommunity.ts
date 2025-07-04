import {
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { EncryptedTransferArgs } from 'core/src/graphql/model/EncryptedTransferArgs'

import { AuthenticationClientFactory } from '@/client/AuthenticationClientFactory'
import { randombytes_random } from 'sodium-native'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/client/1_0/AuthenticationClient'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { encryptAndSign } from 'core/src/auth/jwt/JWT'
import { OpenConnectionCallbackJwtPayloadType } from 'core/src/auth/jwt/payloadtypes/OpenConnectionCallbackJwtPayloadType'
import { AuthenticationJwtPayloadType } from 'core/src/auth/jwt/payloadtypes/AuthenticationJwtPayloadType'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.util.authenticateCommunity`)

export async function startOpenConnectionCallback(
  publicKey: string,
  api: string,
): Promise<void> {
  logger.debug(`Authentication: startOpenConnectionCallback() with:`, {
    publicKey,
  })
  try {
    const homeCom = await getHomeCommunity()
    const homeFedCom = await DbFedCommunity.findOneByOrFail({
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
      const url = homeFedCom.endPoint.endsWith('/')
        ? homeFedCom.endPoint + homeFedCom.apiVersion
        : homeFedCom.endPoint + '/' + homeFedCom.apiVersion

      const callbackArgs = new OpenConnectionCallbackJwtPayloadType(oneTimeCode, url)
      logger.debug(`Authentication: start openConnectionCallback with args:`, callbackArgs)
      // encrypt callbackArgs with requestedCom.publicJwtKey and sign it with homeCom.privateJwtKey
      const jwt = await encryptAndSign(callbackArgs, homeCom!.privateJwtKey!, comA.publicJwtKey!)
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
    const homeCom = await getHomeCommunity()
    const comB = await DbCommunity.findOneByOrFail({
      foreign: true,
      publicKey: fedComB.publicKey,
    })
    if (!comB.publicJwtKey) {
      throw new Error('Public JWT key still not exist for foreign community')
    }

    const client = AuthenticationClientFactory.getInstance(fedComB)

    if (client instanceof V1_0_AuthenticationClient) {
      const authenticationArgs = new AuthenticationJwtPayloadType(oneTimeCode, homeCom!.communityUuid!)
      // encrypt authenticationArgs.uuid with fedComB.publicJwtKey and sign it with homeCom.privateJwtKey
      const jwt = await encryptAndSign(authenticationArgs, homeCom!.privateJwtKey!, comB.publicJwtKey!)
      const args = new EncryptedTransferArgs()
      args.publicKey = comB.publicKey.toString('hex')
      args.jwt = jwt
      logger.debug(`invoke authenticate() with:`, args)
      const fedComUuid = await client.authenticate(args)
      logger.debug(`response of authenticate():`, fedComUuid)
      if (fedComUuid !== null) {
        logger.debug(
          `received communityUUid for callbackFedCom:`,
          fedComUuid,
          new FederatedCommunityLoggingView(fedComB),
        )
        const callbackCom = await DbCommunity.findOneByOrFail({
          foreign: true,
          publicKey: fedComB.publicKey,
        })
        // TODO decrypt fedComUuid with callbackFedCom.publicKey
        callbackCom.communityUuid = fedComUuid
        callbackCom.authenticatedAt = new Date()
        await DbCommunity.save(callbackCom)
        logger.debug('Community Authentication successful:', new CommunityLoggingView(callbackCom))
      } else {
        logger.error('Community Authentication failed:', authenticationArgs)
      }
    }
  } catch (err) {
    logger.error('error in startAuthentication:', err)
  }
}

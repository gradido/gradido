import { federationLogger as logger } from '@/server/logger'
import {
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
} from 'database'
import { OpenConnectionArgs } from '../model/OpenConnectionArgs'
import { OpenConnectionCallbackArgs } from '../model/OpenConnectionCallbackArgs'

import { AuthenticationClientFactory } from '@/client/AuthenticationClientFactory'
import { randombytes_random } from 'sodium-native'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/client/1_0/AuthenticationClient'
import { AuthenticationArgs } from '../model/AuthenticationArgs'
import { encryptAndSign } from 'backend/src/auth/jwt/JWT'
import { OpenConnectionCallbackJwtPayloadType } from 'backend/src/auth/jwt/payloadtypes/OpenConnectionCallbackJwtPayloadType'

export async function startOpenConnectionCallback(
  comA: DbCommunity,
  api: string,
): Promise<void> {
  logger.debug(`Authentication: startOpenConnectionCallback() with:`, {
    comA: new CommunityLoggingView(comA),
  })
  try {
    const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
    const homeFedCom = await DbFedCommunity.findOneByOrFail({
      foreign: false,
      apiVersion: api,
    })
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
      // encrypt callbackArgs with requestedCom.publicKey and sign it with homeCom.privateKey
      const encryptedCallbackArgs = await encryptAndSign(callbackArgs, homeCom.privateJwtKey!, comA.publicJwtKey!)
      if (await client.openConnectionCallback(encryptedCallbackArgs)) {
        logger.debug('Authentication: startOpenConnectionCallback() successful:', callbackArgs)
      } else {
        logger.error('Authentication: startOpenConnectionCallback() failed:', callbackArgs)
      }
    }
  } catch (err) {
    logger.error('Authentication: error in startOpenConnectionCallback:', err)
  }
}

export async function startAuthentication(
  oneTimeCode: string,
  fedComB: DbFedCommunity,
): Promise<void> {
  logger.debug(`Authentication: startAuthentication()...`, {
    oneTimeCode,
    fedComB: new FederatedCommunityLoggingView(fedComB),
  })
  try {
    const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })

    // TODO encrypt homeCom.uuid with homeCom.privateKey and sign it with callbackFedCom.publicKey
    const client = AuthenticationClientFactory.getInstance(fedComB)

    if (client instanceof V1_0_AuthenticationClient) {
      const authenticationArgs = new AuthenticationArgs()
      authenticationArgs.oneTimeCode = oneTimeCode
      // TODO encrypt callbackArgs.url with requestedCom.publicKey and sign it with homeCom.privateKey
      if (homeCom.communityUuid) {
        authenticationArgs.uuid = homeCom.communityUuid
      }
      logger.debug(`Authentication: invoke authenticate() with:`, authenticationArgs)
      const fedComUuid = await client.authenticate(authenticationArgs)
      logger.debug(`Authentication: response of authenticate():`, fedComUuid)
      if (fedComUuid !== null) {
        logger.debug(
          `Authentication: received communityUUid for callbackFedCom:`,
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
        logger.debug(
          'Authentication: Community Authentication successful:',
          new CommunityLoggingView(callbackCom),
        )
      } else {
        logger.error('Authentication: Community Authentication failed:', authenticationArgs)
      }
    }
  } catch (err) {
    logger.error('Authentication: error in startOpenConnectionCallback:', err)
  }
}

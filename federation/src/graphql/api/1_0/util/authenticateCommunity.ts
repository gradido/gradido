import {
  CommunityLoggingView,
  Community as DbCommunity,
  FederatedCommunity as DbFedCommunity,
  FederatedCommunityLoggingView,
} from 'database'
import { getLogger } from 'log4js'
import { OpenConnectionArgs } from '../model/OpenConnectionArgs'
import { OpenConnectionCallbackArgs } from '../model/OpenConnectionCallbackArgs'

import { AuthenticationClientFactory } from '@/client/AuthenticationClientFactory'
import { randombytes_random } from 'sodium-native'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/client/1_0/AuthenticationClient'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { AuthenticationArgs } from '../model/AuthenticationArgs'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.util.authenticateCommunity`)

export async function startOpenConnectionCallback(
  args: OpenConnectionArgs,
  comA: DbCommunity,
  api: string,
): Promise<void> {
  logger.debug(`startOpenConnectionCallback() with:`, {
    args,
    comA: new CommunityLoggingView(comA),
  })
  try {
    const homeFedCom = await DbFedCommunity.findOneByOrFail({
      foreign: false,
      apiVersion: api,
    })
    const fedComA = await DbFedCommunity.findOneByOrFail({
      foreign: true,
      apiVersion: api,
      publicKey: comA.publicKey,
    })
    const oneTimeCode = randombytes_random()
    // store oneTimeCode in requestedCom.community_uuid as authenticate-request-identifier
    comA.communityUuid = oneTimeCode.toString()
    await DbCommunity.save(comA)
    logger.debug(
      `Authentication: stored oneTimeCode in requestedCom:`,
      new CommunityLoggingView(comA),
    )

    const client = AuthenticationClientFactory.getInstance(fedComA)

    if (client instanceof V1_0_AuthenticationClient) {
      const callbackArgs = new OpenConnectionCallbackArgs()
      callbackArgs.oneTimeCode = oneTimeCode.toString()
      // TODO encrypt callbackArgs.url with requestedCom.publicKey and sign it with homeCom.privateKey
      callbackArgs.url = homeFedCom.endPoint.endsWith('/')
        ? homeFedCom.endPoint + homeFedCom.apiVersion
        : homeFedCom.endPoint + '/' + homeFedCom.apiVersion
      logger.debug(`Authentication: start openConnectionCallback with args:`, callbackArgs)
      if (await client.openConnectionCallback(callbackArgs)) {
        logger.debug('startOpenConnectionCallback() successful:', callbackArgs)
      } else {
        logger.error('startOpenConnectionCallback() failed:', callbackArgs)
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
      logger.debug(`invoke authenticate() with:`, authenticationArgs)
      const fedComUuid = await client.authenticate(authenticationArgs)
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

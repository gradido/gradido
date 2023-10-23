import { OpenConnectionArgs } from '../model/OpenConnectionArgs'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFedCommunity } from '@entity/FederatedCommunity'
import { federationLogger as logger } from '@/server/logger'
import { OpenConnectionCallbackArgs } from '../model/OpenConnectionCallbackArgs'
// eslint-disable-next-line camelcase
import { randombytes_random } from 'sodium-native'
import { AuthenticationClientFactory } from '@/client/AuthenticationClientFactory'
// eslint-disable-next-line camelcase
import { AuthenticationClient as V1_0_AuthenticationClient } from '@/client/1_0/AuthenticationClient'
import { AuthenticationArgs } from '../model/AuthenticationArgs'

export async function startOpenConnectionCallback(
  args: OpenConnectionArgs,
  requestedCom: DbCommunity,
  api: string,
): Promise<void> {
  logger.debug(
    `Authentication: startOpenConnectionRedirect()...`,
    args.publicKey,
    args.url,
    requestedCom,
  )
  try {
    const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
    const homeFedCom = await DbFedCommunity.findOneByOrFail({
      foreign: false,
      apiVersion: api,
    })
    const oneTimeCode = randombytes_random()
    // store oneTimeCode in requestedCom.community_uuid as authenticate-request-identifier
    requestedCom.communityUuid = oneTimeCode.toString()
    await DbCommunity.save(requestedCom)

    const client = AuthenticationClientFactory.getInstance(homeFedCom)
    // eslint-disable-next-line camelcase
    if (client instanceof V1_0_AuthenticationClient) {
      const callbackArgs = new OpenConnectionCallbackArgs()
      callbackArgs.oneTimeCode = oneTimeCode.toString()
      // TODO encrypt callbackArgs.url with requestedCom.publicKey and sign it with homeCom.privateKey
      callbackArgs.url = homeFedCom.endPoint.endsWith('/')
        ? homeFedCom.endPoint
        : homeFedCom.endPoint + '/' + homeFedCom.apiVersion
      if (await client.openConnectionCallback(callbackArgs)) {
        logger.debug('Authentication: startOpenConnectionRedirect() successful:', callbackArgs)
      } else {
        logger.error('Authentication: startOpenConnectionRedirect() failed:', callbackArgs)
      }
    }
  } catch (err) {
    logger.error('Authentication: error in startOpenConnectionRedirect:', err)
  }
}

export async function startAuthentication(
  oneTimeCode: string,
  callbackFedCom: DbFedCommunity,
): Promise<void> {
  logger.debug(`Authentication: startAuthentication()...`, oneTimeCode, callbackFedCom)
  try {
    const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
    const homeFedCom = await DbFedCommunity.findOneByOrFail({
      foreign: false,
      apiVersion: callbackFedCom.apiVersion,
    })

    // TODO encrypt homeCom.uuid with homeCom.privateKey and sign it with callbackFedCom.publicKey
    const client = AuthenticationClientFactory.getInstance(homeFedCom)
    // eslint-disable-next-line camelcase
    if (client instanceof V1_0_AuthenticationClient) {
      const authenticationArgs = new AuthenticationArgs()
      authenticationArgs.oneTimeCode = oneTimeCode
      // TODO encrypt callbackArgs.url with requestedCom.publicKey and sign it with homeCom.privateKey
      if (homeCom.communityUuid) {
        authenticationArgs.uuid = homeCom.communityUuid
      }
      logger.debug(`Authentication: vor authenticate()...`, authenticationArgs)
      const fedComUuid = await client.authenticate(authenticationArgs)
      logger.debug(`Authentication: nach authenticate()...`, fedComUuid)
      if (fedComUuid !== null) {
        // TODO decrypt fedComUuid with callbackFedCom.publicKey
        const callbackCom = await DbCommunity.findOneByOrFail({
          foreign: true,
          publicKey: callbackFedCom.publicKey,
        })
        callbackCom.communityUuid = fedComUuid
        callbackCom.authenticatedAt = new Date()
        await DbCommunity.save(callbackCom)
        logger.debug('Authentication: Community Authentication successful:', callbackCom)
      } else {
        logger.error('Authentication: Community Authentication failed:', authenticationArgs)
      }
    }
  } catch (err) {
    logger.error('Authentication: error in startOpenConnectionCallback:', err)
  }
}

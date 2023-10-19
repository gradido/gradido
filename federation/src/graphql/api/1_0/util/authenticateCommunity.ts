import { OpenConnectionArgs } from '../model/OpenConnectionArgs'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'
import { federationLogger as logger } from '@/server/logger'
import { OpenConnectionCallbackArgs } from '../model/OpenConnectionCallbackArgs'
// eslint-disable-next-line camelcase
import { randombytes_random } from 'sodium-native'
import { AuthenticationClientFactory } from '@/client/AuthenticationClientFactory'
import { ApiVersionType } from '@/client/enum/apiVersionType'
// eslint-disable-next-line camelcase
import { AuthenticationClient as V1_0_AuthenticationClient } from '@/client/1_0/AuthenticationClient'

export async function startOpenConnectionRedirect(
  args: OpenConnectionArgs,
  requestedCom: DbCommunity,
  api: ApiVersionType,
): Promise<void> {
  logger.debug(
    `Authentication: startOpenConnectionRedirect()...`,
    args.publicKey,
    args.url,
    requestedCom,
  )
  try {
    // TODO verify signing of args.url with requestedCom.publicKey and decrypt with homeCom.privateKey
    const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
    const homeFedCom = await DbFederatedCommunity.findOneByOrFail({
      foreign: false,
      apiVersion: api,
    })
    const oneTimeCode = randombytes_random()
    // store oneTimeCode in requestedCom.community_uuid for authenticate-request-identifier
    requestedCom.communityUuid = oneTimeCode.toString()
    await DbCommunity.save(requestedCom)

    const client = AuthenticationClientFactory.getInstance(homeFedCom)
    // eslint-disable-next-line camelcase
    if (client instanceof V1_0_AuthenticationClient) {
      const callbackArgs = new OpenConnectionCallbackArgs()
      callbackArgs.oneTimeCode = oneTimeCode.toString()
      callbackArgs.publicKey = homeCom.publicKey.toString('hex')
      // TODO signing of callbackArgs.url with requestedCom.publicKey and decrypt with homeCom.privateKey
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

export async function startOpenConnectionCallback(
  args: OpenConnectionCallbackArgs,
  callbackCom: DbCommunity,
): Promise<void> {
  logger.debug(
    `Authentication: startOpenConnectionCallback()...`,
    args.publicKey,
    args.url,
    callbackCom,
  )
  try {
    // TODO verify signing of args.url with requestedCom.publicKey and decrypt with homeCom.privateKey
    const homeCom = await DbCommunity.findOneByOrFail({ foreign: false })
    
    
  } catch (err) {
    logger.error('Authentication: error in startOpenConnectionCallback:', err)
  }
}

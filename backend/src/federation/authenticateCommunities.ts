import { CommunityLoggingView, Community as DbCommunity, FederatedCommunity as DbFederatedCommunity, FederatedCommunityLoggingView, getHomeCommunity } from 'database'
import { validate as validateUUID, version as versionUUID } from 'uuid'
import { randombytes_random } from 'sodium-native'
import { CONFIG } from '@/config'

import { AuthenticationClient as V1_0_AuthenticationClient } from '@/federation/client/1_0/AuthenticationClient'
import { ensureUrlEndsWithSlash } from '@/util/utilities'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { encryptAndSign, OpenConnectionJwtPayloadType } from 'shared'
import { getLogger } from 'log4js'
import { AuthenticationClientFactory } from './client/AuthenticationClientFactory'
import { EncryptedTransferArgs } from 'core'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.authenticateCommunities`)

export async function startCommunityAuthentication(
  fedComB: DbFederatedCommunity,
): Promise<void> {
  const handshakeID = randombytes_random().toString()
  logger.addContext('handshakeID', handshakeID)
  logger.debug(`startCommunityAuthentication()...`, {
    fedComB: new FederatedCommunityLoggingView(fedComB),
  })
  const homeComA = await getHomeCommunity()
  logger.debug('homeComA', new CommunityLoggingView(homeComA!))
  const homeFedComA = await DbFederatedCommunity.findOneByOrFail({
    foreign: false,
    apiVersion: CONFIG.FEDERATION_BACKEND_SEND_ON_API,
  })
  logger.debug('homeFedComA', new FederatedCommunityLoggingView(homeFedComA))
  const comB = await DbCommunity.findOneByOrFail({ publicKey: fedComB.publicKey })
  logger.debug('started with comB:', new CommunityLoggingView(comB))
  // check if communityUuid is not a valid v4Uuid
  try {
    if (
      comB &&
      ((comB.communityUuid === null && comB.authenticatedAt === null) ||
        (comB.communityUuid !== null &&
          (!validateUUID(comB.communityUuid) ||
          versionUUID(comB.communityUuid!) !== 4)))
    ) {
      logger.debug('comB.uuid is null or is a not valid v4Uuid...', comB.communityUuid || 'null', comB.authenticatedAt || 'null')
      const client = AuthenticationClientFactory.getInstance(fedComB)

      if (client instanceof V1_0_AuthenticationClient) {
        if (!comB.publicJwtKey) {
          throw new Error('Public JWT key still not exist for comB ' + comB.name)
        }
        //create JWT with url in payload encrypted by foreignCom.publicJwtKey and signed with homeCom.privateJwtKey
        const payload = new OpenConnectionJwtPayloadType(handshakeID,
          ensureUrlEndsWithSlash(homeFedComA.endPoint).concat(homeFedComA.apiVersion),
        )
        logger.debug('payload', payload)
        const jws = await encryptAndSign(payload, homeComA!.privateJwtKey!, comB.publicJwtKey!)
        logger.debug('jws', jws)
        // prepare the args for the client invocation
        const args = new EncryptedTransferArgs()
        args.publicKey = homeComA!.publicKey.toString('hex')
        args.jwt = jws
        args.handshakeID = handshakeID
        logger.debug('before client.openConnection() args:', args)
        const result = await client.openConnection(args)
        if (result) {
          logger.debug(`successful initiated at community:`, fedComB.endPoint)
        } else {
          logger.error(`can't initiate at community:`, fedComB.endPoint)
        }
      }
    } else {
      logger.debug(`comB.communityUuid is already a valid v4Uuid ${ comB.communityUuid || 'null' } and was authenticated at ${ comB.authenticatedAt || 'null'}`)
    }
  } catch (err) {
    logger.error(`Error:`, err)
  }
  logger.removeContext('handshakeID')
}

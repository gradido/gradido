import { PeerApiClientCache } from 'core'
import {
  CommunitiesInsert,
  CommunityHandshakeStateType,
  dbClearFederatedCommunities,
  dbFindFederatedCommunitiesNotVerified,
  dbFindForeignCommunitiesNeedingHandshake,
  dbInsertCommunityHandshakeState,
  dbUpdateCommunityHandshakeStateError,
  dbUpdateFederatedCommunitiesVerified,
  dbUpsertVerifiedForeignCommunities,
  drizzleDb,
} from 'database'
import { getLogger, Logger } from 'log4js'
import { CommunityHandshakeData, FederatedCommunity, foreignCommunityInfoSchema } from 'shared'
import { randombytes_random } from 'sodium-native'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

const createLogger = () => getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.validateCommunities`)
const VALIDATE_COMMUNITIES_BATCH_SIZE = 100

export async function startValidateCommunities(timerInterval: number): Promise<void> {
  const logger = createLogger()
  logger.info(`startValidateCommunities loop with an interval of ${timerInterval} ms...`)
  // delete all foreign federated community entries to avoid increasing validation efforts and log-files
  await dbClearFederatedCommunities()

  // TODO: replace the timer-loop by an event-based communication to verify announced foreign communities
  // better to use setTimeout twice than setInterval once -> see https://javascript.info/settimeout-setinterval
  setTimeout(async function run() {
    await validateCommunities(logger)
    setTimeout(run, timerInterval)
  }, timerInterval)
}

async function validateCommunities(logger: Logger): Promise<void> {
  try {
    let lastFederatedCommunityId = 0
    while (true) {
      // search all foreign federated communities which are still not verified or have not been verified since last dht-announcement
      const federatedCommunities = await dbFindFederatedCommunitiesNotVerified(
        VALIDATE_COMMUNITIES_BATCH_SIZE,
        lastFederatedCommunityId,
      )
      // FedCom = Federated Community
      const lastFedCom = federatedCommunities.at(-1)
      if (!lastFedCom) {
        break
      }
      lastFederatedCommunityId = lastFedCom.id
      logger.debug(`found ${federatedCommunities.length} dbCommunities`)

      // Step 1: call get info at all federated communities and compare public key with stored public key
      const getFedComInfoCheckPublicKeyPromises = federatedCommunities.map((fedComB) =>
        federatedCommunityGetInfoCheckPublicKey(fedComB),
      )
      const fedComInfoResults = await Promise.allSettled(getFedComInfoCheckPublicKeyPromises)
      const now = new Date()
      const fedComIds: number[] = []
      const fedComInfos: CommunitiesInsert[] = []

      // Filter out all Federated Communities which don't answear or had a wrong public key
      for (let i = 0; i < fedComInfoResults.length; i++) {
        const result = fedComInfoResults[i]
        if (result.status !== 'fulfilled') {
          logger.warn(
            `get community info at: ${federatedCommunities[i].endPoint} resulted in ${result.status} because: ${result.reason}`,
          )
          continue
        }
        if (!result.value) {
          continue
        }

        fedComIds.push(result.value.federatedCommunityId)
        fedComInfos.push({ ...result.value.foreignCommunity, updatedAt: now })
      }
      // nobody in this batch answered, the next batch may
      if (!fedComIds.length) {
        continue
      }

      const handshakeCommunities = await drizzleDb().transaction(async (tx) => {
        // Step 2: update verifiedAt field on all Federated Communities which answeared
        const verifiedCount = await dbUpdateFederatedCommunitiesVerified(fedComIds, now, tx)
        if (verifiedCount !== fedComIds.length) {
          logger.error(
            `only ${verifiedCount} federated communities verified from ${fedComIds.length}`,
          )
        }

        // Step 3: upsert all verified federated communities as foreign community in communities table
        const upsertAffectedRows = await dbUpsertVerifiedForeignCommunities(fedComInfos, tx)
        if (
          upsertAffectedRows < fedComInfos.length ||
          upsertAffectedRows > fedComInfos.length * 2
        ) {
          logger.error(
            `upsertAffectedRows: ${upsertAffectedRows} on ${fedComInfos.length} communities (per community: 0: nothing happend, 1: insert, 2: update)`,
          )
        }

        return await dbFindForeignCommunitiesNeedingHandshake(fedComIds, tx)
      })
      // Step 4: start handshake with all not handshaked communities or on url change, one after another
      for (const com of handshakeCommunities) {
        await startCommunityAuthentication(com)
      }
    }
  } catch (e) {
    logger.error('Error: ', e)
  }
}
export const validateCommunities__test = validateCommunities

async function federatedCommunityGetInfoCheckPublicKey(fedComB: FederatedCommunity): Promise<{
  foreignCommunity: CommunitiesInsert
  federatedCommunityId: number
} | null> {
  const logger = createLogger()
  logger.addContext('apiUrl', fedComB.endPoint)

  const peerClient = PeerApiClientCache.getInstance().get(fedComB.endPoint, fedComB.publicKey)
  // the client refuses an answer whose signature does not verify against fedComB.publicKey
  const { data: rawPubComInfo, error } = await peerClient.getCommunityInfos()
  // TODO: write last error into db
  if (!rawPubComInfo) {
    logger.warn('missing result of getPublicCommunityInfo', error?.value)
    return null
  }
  const pubComInfo = v.parse(foreignCommunityInfoSchema, rawPubComInfo)

  // TODO: write last error into db
  if (!pubComInfo.publicKey.equals(fedComB.publicKey)) {
    logger.warn(
      'received not matching publicKey',
      pubComInfo.publicKey.toString('hex'),
      fedComB.publicKey.toString('hex'),
    )
    return null
  }
  return {
    foreignCommunity: {
      foreign: true,
      url: fedComB.endPoint,
      ...pubComInfo,
    },
    federatedCommunityId: fedComB.id,
  }
}

export const federatedCommunityGetInfoCheckPublicKey__test = federatedCommunityGetInfoCheckPublicKey

async function startCommunityAuthentication(com: CommunityHandshakeData): Promise<void> {
  const logger = createLogger()
  const handshakeId = randombytes_random()
  logger.addContext('handshakeId', handshakeId)

  const peerClient = PeerApiClientCache.getInstance().get(com.url, com.publicKey)
  // the key as last answered, it may have changed since the client was created
  peerClient.publicJwtKey = com.publicJwtKey

  const stateId = await dbInsertCommunityHandshakeState({
    publicKey: com.publicKey,
    apiVersion: '1_0', // temp while refactoring, later removed
    status: CommunityHandshakeStateType.START_COMMUNITY_AUTHENTICATION,
    handshakeId,
  })
  logger.debug('[START_COMMUNITY_AUTHENTICATION] community handshake state created')

  const result = await peerClient.postHandshake1Open(handshakeId)
  if (result.data === true) {
    logger.debug(`successful initiated at community:`, peerClient)
  } else {
    if (result.error) {
      logger.error(`http error: `, result.error)
      await dbUpdateCommunityHandshakeStateError(stateId, JSON.stringify(result.error))
    } else {
      const errorMsg = `can't initiate at community: ${peerClient}`
      logger.error(errorMsg)
      await dbUpdateCommunityHandshakeStateError(stateId, errorMsg)
    }
  }
}

export const startCommunityAuthentication__test = startCommunityAuthentication

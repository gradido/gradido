import { PeerApiClient, PeerApiClientCache } from 'core'
import {
  CommunitiesInsert,
  CommunityHandshakeStateType,
  dbClearFederatedCommunities,
  dbFindFederatedCommunitiesNotVerified,
  dbFindForeignCommunitiesNeedingHandshake,
  dbUpdateCommunityHandshakeStateError,
  dbUpdateFederatedCommunitiesVerified,
  dbUpsertCommunityHandshakeState,
  dbUpsertVerifiedForeignCommunities,
  drizzleDb,
} from 'database'
import { getLogger, Logger } from 'log4js'
import { FederatedCommunity, foreignCommunityInfoSchema } from 'shared'
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

export async function validateCommunities(logger: Logger): Promise<void> {
  try {
    // search all foreign federated communities which are still not verified or have not been verified since last dht-announcement
    const federatedCommunities = await dbFindFederatedCommunitiesNotVerified(
      VALIDATE_COMMUNITIES_BATCH_SIZE,
    )
    // FedCom = Federated Community
    logger.debug(`found ${federatedCommunities.length} dbCommunities`)

    // Step 1: call get info at all federated communities and compare public key with stored public key
    const getFedComInfoCheckPublicKeyPromises = federatedCommunities.map((fedComB) =>
      federatedCommunityGetInfoCheckPublicKey(fedComB),
    )
    const getFedComInfoResults = await Promise.allSettled(getFedComInfoCheckPublicKeyPromises)
    const now = new Date()
    const fedComIds: number[] = []
    const fedComInfos: CommunitiesInsert[] = []

    // Filter out all Federated Communities which don't answear or had a wrong public key
    for (const result of getFedComInfoResults) {
      if (result.status !== 'fulfilled' || !result.value) {
        continue
      }

      fedComIds.push(result.value.federatedCommunityId)
      fedComInfos.push({
        ...result.value.foreignCommunity,
        creationDate: now,
        updatedAt: now,
      })
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
      const upsertedCount = await dbUpsertVerifiedForeignCommunities(fedComInfos, tx)
      if (upsertedCount !== fedComInfos.length) {
        logger.error(
          `only ${upsertedCount} communities (foreign = true) from ${fedComInfos.length} are created/updated`,
        )
      }

      return await dbFindForeignCommunitiesNeedingHandshake(VALIDATE_COMMUNITIES_BATCH_SIZE, tx)
    })
    // Step 4: start handshake with all not handshaked communities or on url change, one after another
    for (const com of handshakeCommunities) {
      await startCommunityAuthentication(
        PeerApiClientCache.getInstance().get(com.url, com.publicKey),
      )
    }
  } catch (e) {
    logger.error('Error: ', e)
  }
}

async function federatedCommunityGetInfoCheckPublicKey(fedComB: FederatedCommunity): Promise<{
  foreignCommunity: Omit<CommunitiesInsert, 'creationDate'>
  federatedCommunityId: number
} | null> {
  const logger = createLogger()
  logger.addContext('apiUrl', fedComB.apiUrl)

  const peerClient = PeerApiClientCache.getInstance().get(fedComB.apiUrl, fedComB.publicKey)
  const { data: rawPubComInfo } = await peerClient.getCommunityInfos()
  // TODO: write last error into db
  if (!rawPubComInfo) {
    logger.debug('missing result of getPublicCommunityInfo')
    return null
  }
  const pubComInfo = v.parse(foreignCommunityInfoSchema, rawPubComInfo)
  peerClient.publicJwtKey = pubComInfo.publicJwtKey

  // TODO: write last error into db
  if (!pubComInfo.publicKey.equals(fedComB.publicKey)) {
    logger.debug(
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
      publicJwtKey: pubComInfo.publicJwtKey,
      ...fedComB,
    },
    federatedCommunityId: fedComB.id,
  }
}

async function startCommunityAuthentication(client: PeerApiClient): Promise<void> {
  const logger = createLogger()
  const handshakeId = randombytes_random()
  logger.addContext('handshakeId', handshakeId)

  const stateId = await dbUpsertCommunityHandshakeState({
    publicKey: client.publicKey,
    apiVersion: '1_0', // temp while refactoring, later removed
    status: CommunityHandshakeStateType.START_COMMUNITY_AUTHENTICATION,
    handshakeId,
  })
  logger.debug('[START_COMMUNITY_AUTHENTICATION] community handshake state created')

  const result = await client.postHandshake1Open(handshakeId)
  if (result.data === true) {
    logger.debug(`successful initiated at community:`, client)
  } else {
    if (result.error) {
      logger.error(`http error: `, result.error)
      await dbUpdateCommunityHandshakeStateError(stateId, JSON.stringify(result.error))
    } else {
      const errorMsg = `can't initiate at community: ${client}`
      logger.error(errorMsg)
      await dbUpdateCommunityHandshakeStateError(stateId, errorMsg)
    }
  }
}

import { PeerApiClientCache } from 'core'
import {
  CommunitiesInsert,
  CommunityUniqueKey,
  DBUniqueKeyViolation,
  dbClearFederatedCommunities,
  dbFindFederatedCommunitiesNotVerified,
  dbFindForeignCommunitiesByUuid,
  dbInsertForeignCommunity,
  dbUpdateFederatedCommunitiesVerified,
  dbUpdateForeignCommunity,
  drizzleDb,
  getHomeCommunityDrizzle,
} from 'database'
import { getLogger, Logger } from 'log4js'
import {
  FederatedCommunity,
  foreignCommunityInfoSchema,
  foreignCommunityInsertSchema,
  foreignCommunityUpdatesSchema,
  Uuidv4,
} from 'shared'
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
      const fedComUuids: Uuidv4[] = []
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
        fedComUuids.push(result.value.foreignCommunity.communityUuid)
        fedComInfos.push({ ...result.value.foreignCommunity, updatedAt: now, authenticatedAt: now })
      }
      // nobody in this batch answered, the next batch may
      if (!fedComIds.length) {
        continue
      }

      await drizzleDb().transaction(async (tx) => {
        // Step 2: update verifiedAt field on all Federated Communities which answeared
        const verifiedCount = await dbUpdateFederatedCommunitiesVerified(fedComIds, now, tx)
        if (verifiedCount !== fedComIds.length) {
          logger.error(
            `only ${verifiedCount} federated communities verified from ${fedComIds.length}`,
          )
        }
        const existingFederatedCommunities = await dbFindForeignCommunitiesByUuid(fedComUuids, tx)
        // Step 3: insert all new verified federated communities as foreign community in communities table or update if exist and something was changed
        for (const fedCom of fedComInfos) {
          const existingCom = existingFederatedCommunities.get(fedCom.communityUuid)
          if (existingCom) {
            if (!fedCom.publicKey.equals(existingCom.publicKey)) {
              logger.error(
                `${existingCom.name} foreign community public key isn't equal to the stored version`,
              )
            } else if (fedCom.url !== existingCom.url) {
              // TODO: show the admin, let admin decide if update was legit
              logger.error(
                `${existingCom.name} changed url from ${existingCom.url} to ${fedCom.url}`,
              )
            } else if (!fedCom.publicEncryptionKey.equals(existingCom.publicEncryptionKey)) {
              logger.error(
                `${existingCom.name} foreign community public encryption key isn't equal to the stored version`,
              )
            } else if (
              fedCom.name !== existingCom.name ||
              fedCom.description !== existingCom.description ||
              fedCom.hieroTopicId !== existingCom.hieroTopicId
            ) {
              await dbUpdateForeignCommunity(
                existingCom.id,
                v.parse(foreignCommunityUpdatesSchema, fedCom),
                tx,
              )
            }
          } else {
            const result = await dbInsertForeignCommunity(
              v.parse(foreignCommunityInsertSchema, fedCom),
              tx,
            )
            if (!result.success) {
              if (result.error instanceof DBUniqueKeyViolation) {
                const field = result.error.uniqueKey
                if (field === CommunityUniqueKey.COMMUNITY_UUID) {
                  logger.error(
                    `Community UUID Collision detected with uuid: ${fedCom.communityUuid}`,
                  )
                  continue
                } else if (field === CommunityUniqueKey.PUBLIC_KEY) {
                  logger.error(`public key already in use: ${fedCom.publicKey.toString('hex')}`)
                  continue
                } else if (field === CommunityUniqueKey.URL) {
                  logger.warn(
                    `foreign community url already in use: name: ${fedCom.name}, url: ${fedCom.url}`,
                  )
                  continue
                }
              }
              throw result.error
            } else {
              logger.info(`new community added: ${fedCom.name}`)
            }
          }
        }
      })
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
  if (pubComInfo.communityUuid === (await getHomeCommunityDrizzle()).communityUuid) {
    logger.error(
      `another community uses our own community uuid: ${pubComInfo.name}`,
      fedComB.endPoint,
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

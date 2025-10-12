import {
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
  FederatedCommunityLoggingView,
  getHomeCommunity,
  getNotReachableCommunities,
} from 'database'
import { IsNull } from 'typeorm'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { FederationClient as V1_0_FederationClient } from '@/federation/client/1_0/FederationClient'
import { PublicCommunityInfo } from '@/federation/client/1_0/model/PublicCommunityInfo'
import { FederationClientFactory } from '@/federation/client/FederationClientFactory'
import { LogError } from '@/server/LogError'
import { createKeyPair, uint32Schema } from 'shared'
import { getLogger } from 'log4js'
import { startCommunityAuthentication } from './authenticateCommunities'
import { PublicCommunityInfoLoggingView } from './client/1_0/logging/PublicCommunityInfoLogging.view'
import { ApiVersionType } from 'core'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.validateCommunities`)

export async function startValidateCommunities(timerInterval: number): Promise<void> {
  if (Number.isNaN(timerInterval) || timerInterval <= 0) {
    throw new LogError('FEDERATION_VALIDATE_COMMUNITY_TIMER is not a positive number')
  }
  logger.info(`startValidateCommunities loop with an interval of ${timerInterval} ms...`)
  // delete all foreign federated community entries to avoid increasing validation efforts and log-files
  await DbFederatedCommunity.delete({ foreign: true })

  // clean community_uuid and authenticated_at fields for community with one-time-code in community_uuid field
  const notReachableCommunities = await getNotReachableCommunities()
  for (const community of notReachableCommunities) {
    if (uint32Schema.safeParse(Number(community.communityUuid)).success) {
      community.communityUuid = null
      community.authenticatedAt = null
      await DbCommunity.save(community)
    }
  }

  // TODO: replace the timer-loop by an event-based communication to verify announced foreign communities
  // better to use setTimeout twice than setInterval once -> see https://javascript.info/settimeout-setinterval
  setTimeout(async function run() {
    await validateCommunities()
    setTimeout(run, timerInterval)
  }, timerInterval)
}

export async function validateCommunities(): Promise<void> {
  // search all foreign federated communities which are still not verified or have not been verified since last dht-announcement
  const dbFederatedCommunities: DbFederatedCommunity[] =
    await DbFederatedCommunity.createQueryBuilder()
      .where({ foreign: true, verifiedAt: IsNull() })
      .orWhere('verified_at < last_announced_at')
      .getMany()

  logger.debug(`found ${dbFederatedCommunities.length} dbCommunities`)
  for (const dbFedComB of dbFederatedCommunities) {
    logger.debug('dbFedComB', new FederatedCommunityLoggingView(dbFedComB))
    const apiValueStrings: string[] = Object.values(ApiVersionType)
    logger.debug(`suppported ApiVersions=`, apiValueStrings)
    if (!apiValueStrings.includes(dbFedComB.apiVersion)) {
      logger.debug('dbFedComB with unsupported apiVersion', dbFedComB.endPoint, dbFedComB.apiVersion)
      continue
    }
    try {
      const client = FederationClientFactory.getInstance(dbFedComB)

      if (client instanceof V1_0_FederationClient) {
        const pubKey = await client.getPublicKey()
        if (pubKey && pubKey === dbFedComB.publicKey.toString('hex')) {
          await DbFederatedCommunity.update({ id: dbFedComB.id }, { verifiedAt: new Date() })
          logger.debug(`verified dbFedComB with:`, dbFedComB.endPoint)
          const pubComInfo = await client.getPublicCommunityInfo()
          if (pubComInfo) {
            await writeForeignCommunity(dbFedComB, pubComInfo)
            logger.debug(`wrote response of getPublicCommunityInfo in dbFedComB ${dbFedComB.endPoint}`)
            try {
              await startCommunityAuthentication(dbFedComB)
            } catch (err) {
              logger.warn(`Warning: Authentication of community ${dbFedComB.endPoint} still ongoing:`, err)
            }
          } else {
            logger.debug('missing result of getPublicCommunityInfo')
          }
        } else {
          logger.debug('received not matching publicKey:', pubKey, dbFedComB.publicKey.toString('hex'))
        }
      }
    } catch (err) {
      logger.error(`Error:`, err)
    }
  }
}

export async function writeJwtKeyPairInHomeCommunity(): Promise<DbCommunity> {
  logger.debug(`Federation: writeJwtKeyPairInHomeCommunity`)
  try {
    // check for existing homeCommunity entry
    let homeCom = await getHomeCommunity()
    if (homeCom) {
      if (!homeCom.publicJwtKey && !homeCom.privateJwtKey) {
        // Generate key pair using jose library
        const { publicKey, privateKey } = await createKeyPair();
        logger.debug(`Federation: writeJwtKeyPairInHomeCommunity publicKey=`, publicKey);
        logger.debug(`Federation: writeJwtKeyPairInHomeCommunity privateKey=`, privateKey.slice(0, 20));
        
        homeCom.publicJwtKey = publicKey;
        logger.debug(`Federation: writeJwtKeyPairInHomeCommunity publicJwtKey.length=`, homeCom.publicJwtKey.length);
        homeCom.privateJwtKey = privateKey;
        logger.debug(`Federation: writeJwtKeyPairInHomeCommunity privateJwtKey.length=`, homeCom.privateJwtKey.length);
        await DbCommunity.save(homeCom)
        logger.debug(`Federation: writeJwtKeyPairInHomeCommunity done`)
      } else {
        logger.debug(`Federation: writeJwtKeyPairInHomeCommunity: keypair already exists`)
      }
    } else {
      throw new Error(`Error! A HomeCommunity-Entry still not exist! Please start the DHT-Modul first.`)
    }
    return homeCom
  } catch (err) {
    throw new Error(`Error writing JwtKeyPair in HomeCommunity-Entry: ${err}`)
  }
}

async function writeForeignCommunity(
  dbCom: DbFederatedCommunity,
  pubInfo: PublicCommunityInfo,
): Promise<void> {
  if (!dbCom || !pubInfo || !(dbCom.publicKey.toString('hex') === pubInfo.publicKey)) {
    const pubInfoView = new PublicCommunityInfoLoggingView(pubInfo)
    logger.error(
      `Error in writeForeignCommunity: missmatching parameters or publicKey. pubInfo:${pubInfoView.toString(
        true,
      )}`,
    )
  } else {
    let com = await DbCommunity.findOneBy({ publicKey: dbCom.publicKey })
    if (!com) {
      com = DbCommunity.create()
    }
    com.creationDate = pubInfo.creationDate
    com.description = pubInfo.description
    com.foreign = true
    com.name = pubInfo.name
    com.publicKey = dbCom.publicKey
    com.publicJwtKey = pubInfo.publicJwtKey
    com.url = dbCom.endPoint
    await DbCommunity.save(com)
  }
}

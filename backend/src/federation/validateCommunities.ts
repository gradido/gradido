import {
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
  getHomeCommunity,
  getReachableCommunities,
} from 'database'
import { IsNull } from 'typeorm'

import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { FederationClient as V1_0_FederationClient } from '@/federation/client/1_0/FederationClient'
import { PublicCommunityInfo } from '@/federation/client/1_0/model/PublicCommunityInfo'
import { FederationClientFactory } from '@/federation/client/FederationClientFactory'
import { LogError } from '@/server/LogError'
import { createKeyPair, Ed25519PublicKey } from 'shared'
import { getLogger } from 'log4js'
import { startCommunityAuthentication } from './authenticateCommunities'
import { PublicCommunityInfoLoggingView } from './client/1_0/logging/PublicCommunityInfoLogging.view'
import { ApiVersionType } from 'core'
import { CONFIG } from '@/config'
import * as path from 'node:path'
import * as fs from 'node:fs'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.validateCommunities`)

export async function startValidateCommunities(timerInterval: number): Promise<void> {
  if (Number.isNaN(timerInterval) || timerInterval <= 0) {
    throw new LogError('FEDERATION_VALIDATE_COMMUNITY_TIMER is not a positive number')
  }
  logger.info(`startValidateCommunities loop with an interval of ${timerInterval} ms...`)
  // delete all foreign federated community entries to avoid increasing validation efforts and log-files
  await DbFederatedCommunity.delete({ foreign: true })

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
    logger.debug(`verify federation community: ${dbFedComB.endPoint}${dbFedComB.apiVersion}`)
    const apiValueStrings: string[] = Object.values(ApiVersionType)
    if (!apiValueStrings.includes(dbFedComB.apiVersion)) {
      logger.debug('dbFedComB with unsupported apiVersion', dbFedComB.endPoint, dbFedComB.apiVersion)
      logger.debug(`supported ApiVersions=`, apiValueStrings)
      continue
    }
    try {
      const client = FederationClientFactory.getInstance(dbFedComB)

      if (client instanceof V1_0_FederationClient) {
        // throw if key isn't valid hex with length 64
        const clientPublicKey = new Ed25519PublicKey(await client.getPublicKey())
        // throw if key isn't valid hex with length 64
        const fedComBPublicKey = new Ed25519PublicKey(dbFedComB.publicKey)
        if (clientPublicKey.isSame(fedComBPublicKey)) {
          await DbFederatedCommunity.update({ id: dbFedComB.id }, { verifiedAt: new Date() })
          // logger.debug(`verified dbFedComB with:`, dbFedComB.endPoint)
          const pubComInfo = await client.getPublicCommunityInfo()
          if (pubComInfo) {
            await writeForeignCommunity(dbFedComB, pubComInfo)
            logger.debug(`wrote response of getPublicCommunityInfo in dbFedComB ${dbFedComB.endPoint}`)
            try {
              const result = await startCommunityAuthentication(dbFedComB)
              logger.info(`${dbFedComB.endPoint}${dbFedComB.apiVersion} verified, authentication state: ${result}`)
            } catch (err) {
              logger.warn(`Warning: Authentication of community ${dbFedComB.endPoint} still ongoing:`, err)
            }
          } else {
            logger.debug('missing result of getPublicCommunityInfo')
          }
        } else {
          logger.debug('received not matching publicKey:', clientPublicKey.asHex(), fedComBPublicKey.asHex())
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
    com.hieroTopicId = pubInfo.hieroTopicId
    await DbCommunity.save(com)
  }
}

// prototype, later add api call to gradido dlt node server for adding/updating communities
type CommunityForDltNodeServer = {
  communityId: string
  hieroTopicId: string
  alias: string
  folder: string
}

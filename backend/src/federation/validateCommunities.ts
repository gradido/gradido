import {
  Community as DbCommunity,
  FederatedCommunity as DbFederatedCommunity,
  FederatedCommunityLoggingView,
} from 'database'
import { IsNull } from 'typeorm'

import { FederationClient as V1_0_FederationClient } from '@/federation/client/1_0/FederationClient'
import { PublicCommunityInfo } from '@/federation/client/1_0/model/PublicCommunityInfo'
import { FederationClientFactory } from '@/federation/client/FederationClientFactory'
import { LogError } from '@/server/LogError'
import { getLogger } from 'log4js'
import { startCommunityAuthentication } from './authenticateCommunities'
import { PublicCommunityInfoLoggingView } from './client/1_0/logging/PublicCommunityInfoLogging.view'
import { ApiVersionType } from './enum/apiVersionType'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'

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
  const dbFederatedCommunities: DbFederatedCommunity[] =
    await DbFederatedCommunity.createQueryBuilder()
      .where({ foreign: true, verifiedAt: IsNull() })
      .orWhere('verified_at < last_announced_at')
      .getMany()

  logger.debug(`found ${dbFederatedCommunities.length} dbCommunities`)
  for (const dbCom of dbFederatedCommunities) {
    logger.debug('dbCom', new FederatedCommunityLoggingView(dbCom))
    const apiValueStrings: string[] = Object.values(ApiVersionType)
    logger.debug(`suppported ApiVersions=`, apiValueStrings)
    if (!apiValueStrings.includes(dbCom.apiVersion)) {
      logger.debug('dbCom with unsupported apiVersion', dbCom.endPoint, dbCom.apiVersion)
      continue
    }
    try {
      const client = FederationClientFactory.getInstance(dbCom)

      if (client instanceof V1_0_FederationClient) {
        const pubKey = await client.getPublicKey()
        if (pubKey && pubKey === dbCom.publicKey.toString('hex')) {
          await DbFederatedCommunity.update({ id: dbCom.id }, { verifiedAt: new Date() })
          logger.debug(`verified community with:`, dbCom.endPoint)
          const pubComInfo = await client.getPublicCommunityInfo()
          if (pubComInfo) {
            await writeForeignCommunity(dbCom, pubComInfo)
            await startCommunityAuthentication(dbCom)
            logger.debug(`write publicInfo of community: name=${pubComInfo.name}`)
          } else {
            logger.debug('missing result of getPublicCommunityInfo')
          }
        } else {
          logger.debug('received not matching publicKey:', pubKey, dbCom.publicKey.toString('hex'))
        }
      }
    } catch (err) {
      logger.error(`Error:`, err)
    }
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
    com.url = dbCom.endPoint
    await DbCommunity.save(com)
  }
}

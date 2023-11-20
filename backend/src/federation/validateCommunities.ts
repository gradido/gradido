/** eslint-disable @typescript-eslint/no-unsafe-assignment */
/** eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNull } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

// eslint-disable-next-line camelcase
import { FederationClient as V1_0_FederationClient } from '@/federation/client/1_0/FederationClient'
import { PublicCommunityInfo } from '@/federation/client/1_0/model/PublicCommunityInfo'
import { FederationClientFactory } from '@/federation/client/FederationClientFactory'
import { backendLogger as logger } from '@/server/logger'

import { startCommunityAuthentication } from './authenticateCommunities'
import { ApiVersionType } from './enum/apiVersionType'
import { communityList, userList } from '@/apis/gms/GmsClient'

export async function startValidateCommunities(timerInterval: number): Promise<void> {
  logger.info(
    `Federation: startValidateCommunities loop with an interval of ${timerInterval} ms...`,
  )
  // delete all foreign federated community entries to avoid increasing validation efforts and log-files
  await DbFederatedCommunity.delete({ foreign: true })

  // TODO: replace the timer-loop by an event-based communication to verify announced foreign communities
  // better to use setTimeout twice than setInterval once -> see https://javascript.info/settimeout-setinterval
  setTimeout(function run() {
    void validateCommunities()
    setTimeout(run, timerInterval)
  }, timerInterval)
}

export async function validateCommunities(): Promise<void> {
  // test GMS-Api Client
  try {
    const gmsComArray = await communityList()
    logger.debug('GMS-Community-List:', gmsComArray)
    const gmsUserArray = await userList()
    logger.debug('GMS-Community-User-List:', gmsUserArray)
  } catch (err) {
    logger.error('Error in GMS-API:', err)
  }

  const dbFederatedCommunities: DbFederatedCommunity[] =
    await DbFederatedCommunity.createQueryBuilder()
      .where({ foreign: true, verifiedAt: IsNull() })
      .orWhere('verified_at < last_announced_at')
      .getMany()

  logger.debug(`Federation: found ${dbFederatedCommunities.length} dbCommunities`)
  for (const dbCom of dbFederatedCommunities) {
    logger.debug('Federation: dbCom', dbCom)
    const apiValueStrings: string[] = Object.values(ApiVersionType)
    logger.debug(`suppported ApiVersions=`, apiValueStrings)
    if (!apiValueStrings.includes(dbCom.apiVersion)) {
      logger.debug(
        'Federation: dbCom with unsupported apiVersion',
        dbCom.endPoint,
        dbCom.apiVersion,
      )
      continue
    }
    try {
      const client = FederationClientFactory.getInstance(dbCom)
      // eslint-disable-next-line camelcase
      if (client instanceof V1_0_FederationClient) {
        const pubKey = await client.getPublicKey()
        if (pubKey && pubKey === dbCom.publicKey.toString()) {
          await DbFederatedCommunity.update({ id: dbCom.id }, { verifiedAt: new Date() })
          logger.debug(`Federation: verified community with:`, dbCom.endPoint)
          const pubComInfo = await client.getPublicCommunityInfo()
          if (pubComInfo) {
            await writeForeignCommunity(dbCom, pubComInfo)
            await startCommunityAuthentication(dbCom)
            logger.debug(`Federation: write publicInfo of community: name=${pubComInfo.name}`)
          } else {
            logger.debug('Federation: missing result of getPublicCommunityInfo')
          }
        } else {
          logger.debug(
            'Federation: received not matching publicKey:',
            pubKey,
            dbCom.publicKey.toString(),
          )
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
  if (!dbCom || !pubInfo || !(dbCom.publicKey.toString() === pubInfo.publicKey)) {
    logger.error(
      `Error in writeForeignCommunity: missmatching parameters or publicKey. pubInfo:${JSON.stringify(
        pubInfo,
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

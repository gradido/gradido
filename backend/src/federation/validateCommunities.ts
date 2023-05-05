/** eslint-disable @typescript-eslint/no-unsafe-assignment */
/** eslint-disable @typescript-eslint/no-unsafe-call */
import { IsNull } from '@dbTools/typeorm'
import { Community as DbCommunity } from '@entity/Community'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line camelcase
import { FederationClientImpl as V1_0_FederationClientImpl } from './client/1_0/FederationClientImpl'
// eslint-disable-next-line camelcase
import { FederationClientImpl as V1_1_FederationClientImpl } from './client/1_1/FederationClientImpl'
import { FederationClient, PublicCommunityInfo } from './client/FederationClient'
import { ApiVersionType } from './enum/apiVersionType'

export function startValidateCommunities(timerInterval: number): void {
  logger.info(
    `Federation: startValidateCommunities loop with an interval of ${timerInterval} ms...`,
  )
  // TODO: replace the timer-loop by an event-based communication to verify announced foreign communities
  // better to use setTimeout twice than setInterval once -> see https://javascript.info/settimeout-setinterval
  setTimeout(function run() {
    void validateCommunities()
    setTimeout(run, timerInterval)
  }, timerInterval)
}

export async function validateCommunities(): Promise<void> {
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
    if (apiValueStrings.includes(dbCom.apiVersion)) {
      logger.debug(
        `Federation: validate publicKey for dbCom: ${dbCom.id} with apiVersion=${dbCom.apiVersion}`,
      )
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const pubKey = await getVersionedFederationClient(dbCom.apiVersion).requestGetPublicKey(
          dbCom,
        )
        logger.info(
          'Federation: received publicKey from endpoint',
          pubKey,
          `${dbCom.endPoint}/${dbCom.apiVersion}`,
        )
        if (pubKey && pubKey === dbCom.publicKey.toString()) {
          logger.info(`Federation: matching publicKey:  ${pubKey}`)
          await DbFederatedCommunity.update({ id: dbCom.id }, { verifiedAt: new Date() })
          logger.debug(`Federation: updated dbCom:  ${JSON.stringify(dbCom)}`)

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const pubInfo = await getVersionedFederationClient(
            dbCom.apiVersion,
          ).requestGetPublicCommunityInfo(dbCom)
          logger.debug(`Federation: getPublicInfo pubInfo:  ${JSON.stringify(pubInfo)}`)
          if (pubInfo) {
            logger.info(`Federation: write foreign community...`)
            await writeForeignCommunity(dbCom, pubInfo)
            logger.info(`Federation: write foreign community... successfully`)
          }
        } else {
          logger.warn(
            `Federation: received not matching publicKey -> received: ${
              pubKey || 'null'
            }, expected: ${dbCom.publicKey.toString()} `,
          )
          // DbCommunity.delete({ id: dbCom.id })
        }
      } catch (err) {
        logger.error(`Error:`, err)
      }
    } else {
      logger.warn(
        `Federation: dbCom: ${dbCom.id} with unsupported apiVersion=${dbCom.apiVersion}; supported versions`,
        apiValueStrings,
      )
    }
  }
}

async function writeForeignCommunity(
  dbCom: DbFederatedCommunity,
  pubInfo: PublicCommunityInfo,
): Promise<void> {
  if (!dbCom || !pubInfo || !(dbCom.publicKey.toString('hex') === pubInfo.publicKey)) {
    logger.error(
      `Error in writeForeignCommunity: missmatching parameters or publicKey. pubInfo:${JSON.stringify(
        pubInfo,
      )}`,
    )
  } else {
    let com = await DbCommunity.findOne({ publicKey: dbCom.publicKey })
    if (!com) {
      com = DbCommunity.create()
    }
    com.creationDate = pubInfo.createdAt
    com.description = pubInfo.description
    com.foreign = true
    com.name = pubInfo.name
    com.publicKey = dbCom.publicKey
    com.url = dbCom.endPoint
    await DbCommunity.save(com)
  }
}

function getVersionedFederationClient(apiVersion: string): FederationClient {
  switch (apiVersion) {
    case ApiVersionType.V1_0:
      // eslint-disable-next-line camelcase
      return new V1_0_FederationClientImpl()
    case ApiVersionType.V1_1:
      // eslint-disable-next-line camelcase
      return new V1_1_FederationClientImpl()
    default:
      // eslint-disable-next-line camelcase
      return new V1_0_FederationClientImpl()
  }
}

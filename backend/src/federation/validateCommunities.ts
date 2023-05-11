/** eslint-disable @typescript-eslint/no-unsafe-call */
/** eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IsNull } from '@dbTools/typeorm'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

import { backendLogger as logger } from '@/server/logger'

// eslint-disable-next-line camelcase
import { FederationClient as FederationClient_V1_0 } from './client/1_0/FederationClient'
// eslint-disable-next-line camelcase
import { FederationClient as FederationClient_V1_1 } from './client/1_1/FederationClient'
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
        const pubKey = await invokeVersionedRequestGetPublicKey(dbCom)
        logger.info(
          'Federation: received publicKey from endpoint',
          pubKey,
          `${dbCom.endPoint}/${dbCom.apiVersion}`,
        )
        if (pubKey && pubKey === dbCom.publicKey.toString()) {
          logger.info(`Federation: matching publicKey:  ${pubKey}`)
          await DbFederatedCommunity.update({ id: dbCom.id }, { verifiedAt: new Date() })
          logger.debug(`Federation: updated dbCom:  ${JSON.stringify(dbCom)}`)
        } else {
          logger.warn(
            `Federation: received not matching publicKey -> received: ${
              pubKey ?? 'null'
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

async function invokeVersionedRequestGetPublicKey(
  dbCom: DbFederatedCommunity,
): Promise<string | undefined> {
  switch (dbCom.apiVersion) {
    case ApiVersionType.V1_0:
      return new FederationClient_V1_0().requestGetPublicKey(dbCom)
    case ApiVersionType.V1_1:
      return new FederationClient_V1_1().requestGetPublicKey(dbCom)
    default:
      return undefined
  }
}

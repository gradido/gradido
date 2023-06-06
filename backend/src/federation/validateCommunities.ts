/** eslint-disable @typescript-eslint/no-unsafe-call */
/** eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IsNull } from '@dbTools/typeorm'
import { FederatedCommunity as DbFederatedCommunity } from '@entity/FederatedCommunity'

// eslint-disable-next-line camelcase
import { FederationClient as V1_0_FederationClient } from '@/federation/client/1_0/FederationClient'
import { FederationClientFactory } from '@/federation/client/FederationClientFactory'
import { backendLogger as logger } from '@/server/logger'

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
    if (!apiValueStrings.includes(dbCom.apiVersion)) {
      logger.warn('Federation: dbCom with unsupported apiVersion', dbCom.endPoint, dbCom.apiVersion)
      continue
    }
    try {
      const client = FederationClientFactory.getInstance(dbCom)
      // eslint-disable-next-line camelcase
      if (client instanceof V1_0_FederationClient) {
        const pubKey = await client.getPublicKey()
        if (pubKey && pubKey === dbCom.publicKey.toString()) {
          await DbFederatedCommunity.update({ id: dbCom.id }, { verifiedAt: new Date() })
          logger.info('Federation: verified community with', dbCom.endPoint)
        } else {
          logger.warn(
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

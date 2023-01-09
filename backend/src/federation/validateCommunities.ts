import { Community as DbCommunity } from '@entity/Community'
import { IsNull } from '@dbTools/typeorm'
// eslint-disable-next-line camelcase
import { requestGetPublicKey as v1_0_requestGetPublicKey } from './client/1_0/FederationClient'
// eslint-disable-next-line camelcase
import { requestGetPublicKey as v1_1_requestGetPublicKey } from './client/1_1/FederationClient'
// eslint-disable-next-line camelcase
import { V1_0_FdCommunity } from './graphql/1_0/model/V1_0_FdCommunity'
// eslint-disable-next-line camelcase
import { V1_1_FdCommunity } from './graphql/1_1/model/V1_1_FdCommunity'
import { backendLogger as logger } from '@/server/logger'
import { ApiVersionType } from './enum/apiVersionType'

export async function startValidateCommunities(timerInterval: number): Promise<void> {
  logger.info(
    `Federation: startValidateCommunities loop with an interval of ${timerInterval} ms...`,
  )
  while (true) {
    const dbCommunities: DbCommunity[] = await DbCommunity.createQueryBuilder()
      .where({ verifiedAt: IsNull() })
      .orWhere('verified_at < last_announced_at')
      .getMany()
    /*
    const dbCommunities: DbCommunity[] = await DbCommunity.getRepository().manager.query(
      'SELECT * FROM `communities` `Community` WHERE (`Community`.`verified_at` IS NULL OR `Community`.`verified_at` < `Community`.`last_announced_at`)',
    )
    */
    logger.debug(`Federation: found ${dbCommunities.length} dbCommunities`)
    if (dbCommunities) {
      dbCommunities.forEach(async function (dbCom) {
        logger.debug(`Federation: dbCom: ${JSON.stringify(dbCom)}`)
        const fdCom = getVersionedFdCommunity(dbCom)
        if (!fdCom) {
          logger.warn(
            `Federation: unsupported ApiVersion ${dbCom.apiVersion} of Community with id= ${dbCom.id}`,
          )
          return
        }
        const apiValueStrings: string[] = Object.values(ApiVersionType)
        logger.debug(`suppported ApiVersions=`, apiValueStrings)
        if (apiValueStrings.includes(fdCom.apiVersion)) {
          logger.debug(
            `Federation: validate publicKey for dbCom: ${dbCom.id} with apiVersion=${dbCom.apiVersion}`,
          )
          const pubKey = await invokeVersionedRequestGetPublicKey(fdCom)
          logger.debug(`Federation: received publicKey:  ${pubKey}`)
          if (pubKey && pubKey === fdCom.publicKey) {
            logger.debug(`Federation: matching publicKey:  ${pubKey}`)
            DbCommunity.update({ id: fdCom.id }, { verifiedAt: new Date() })
            logger.debug(`Federation: updated dbCom:  ${JSON.stringify(dbCom)}`)
          }
        } else {
          logger.debug(
            `Federation: dbCom: ${fdCom.id} with unsupported apiVersion=${fdCom.apiVersion}; supported versions=${apiValueStrings}`,
          )
        }
      })
    }
    logger.debug(`Federation: loop starts sleeping...`)
    await sleep(timerInterval)
    logger.debug(`Federation: loop ends sleeping`)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getVersionedFdCommunity(dbCom: DbCommunity) {
  switch (dbCom.apiVersion) {
    case ApiVersionType.V1_0:
      // eslint-disable-next-line new-cap
      return new V1_0_FdCommunity(dbCom)
    case ApiVersionType.V1_1:
      // eslint-disable-next-line new-cap
      return new V1_1_FdCommunity(dbCom)
  }
  return undefined
}

async function invokeVersionedRequestGetPublicKey(
  // eslint-disable-next-line camelcase
  fdCom: V1_0_FdCommunity | V1_1_FdCommunity,
): Promise<string | undefined> {
  switch (fdCom.apiVersion) {
    case ApiVersionType.V1_0:
      return v1_0_requestGetPublicKey(fdCom)
    case ApiVersionType.V1_1:
      return v1_1_requestGetPublicKey(fdCom)
  }
  return undefined
}

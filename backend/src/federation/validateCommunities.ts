import { Community as DbCommunity } from '@entity/Community'
import { IsNull } from '@dbTools/typeorm'
// eslint-disable-next-line camelcase
import { requestGetPublicKey as v1_0_requestGetPublicKey } from './client/1_0/FederationClient'
// eslint-disable-next-line camelcase
import { requestGetPublicKey as v1_1_requestGetPublicKey } from './client/1_1/FederationClient'
import { backendLogger as logger } from '@/server/logger'
import { ApiVersionType } from './enum/apiVersionType'

export async function startValidateCommunities(timerInterval: number): Promise<void> {
  logger.info(
    `Federation: startValidateCommunities loop with an interval of ${timerInterval} ms...`,
  )
  while (true) {
    validateCommunities()
    logger.debug(`Federation: loop starts sleeping...`)
    await sleep(timerInterval)
    logger.debug(`Federation: loop ends sleeping`)
  }
}

export async function validateCommunities(): Promise<void> {
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
      const apiValueStrings: string[] = Object.values(ApiVersionType)
      logger.debug(`suppported ApiVersions=`, apiValueStrings)
      if (apiValueStrings.includes(dbCom.apiVersion)) {
        logger.debug(
          `Federation: validate publicKey for dbCom: ${dbCom.id} with apiVersion=${dbCom.apiVersion}`,
        )
        const pubKey = await invokeVersionedRequestGetPublicKey(dbCom)
        logger.info(
          `Federation: received publicKey=${pubKey} from endpoint=${dbCom.endPoint}/${dbCom.apiVersion}`,
        )
        if (pubKey && pubKey === dbCom.publicKey.toString('hex')) {
          logger.info(`Federation: matching publicKey:  ${pubKey}`)
          DbCommunity.update({ id: dbCom.id }, { verifiedAt: new Date() })
          logger.debug(`Federation: updated dbCom:  ${JSON.stringify(dbCom)}`)
        }
        /*
        else {
          logger.warn(`Federation: received unknown publicKey -> delete dbCom with id=${dbCom.id} `)
          DbCommunity.delete({ id: dbCom.id })
        }
        */
      } else {
        logger.warn(
          `Federation: dbCom: ${dbCom.id} with unsupported apiVersion=${dbCom.apiVersion}; supported versions=${apiValueStrings}`,
        )
      }
    })
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function invokeVersionedRequestGetPublicKey(dbCom: DbCommunity): Promise<string | undefined> {
  switch (dbCom.apiVersion) {
    case ApiVersionType.V1_0:
      return v1_0_requestGetPublicKey(dbCom)
    case ApiVersionType.V1_1:
      return v1_1_requestGetPublicKey(dbCom)
    default:
      return undefined
  }
}

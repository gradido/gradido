import { Community as DbCommunity } from '@entity/Community'
import { IsNull, LessThan, Raw } from '@dbTools/typeorm'
import { requestGetPublicKey } from './client/1_0/FederationClient'
import { FdCommunity } from './graphql/1_0/model/FdCommunity'
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
        const fdCom = new FdCommunity(dbCom)
        console.log(`ApiVersionType=`, ApiVersionType)
        const apiValueStrings: string[] = Object.values(ApiVersionType)
        if (apiValueStrings.includes(fdCom.apiVersion)) {
          logger.debug(
            `Federation: validate publicKey for dbCom: ${dbCom.id} with apiVersion=${dbCom.apiVersion}`,
          )
          const pubKey = await requestGetPublicKey(fdCom)
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

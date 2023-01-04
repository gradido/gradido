import { Community as DbCommunity } from '@entity/Community'
// import { IsNull, LessThan, Raw } from '@dbTools/typeorm'
import { requestGetPublicKey } from './client/1_0/FederationClient'
import { FdCommunity } from './graphql/1_0/model/FdCommunity'
import { backendLogger as logger } from '@/server/logger'

export async function startValidateCommunities(timerInterval: number): Promise<void> {
  logger.info(
    `Federation: startValidateCommunities loop with an interval of ${timerInterval} ms...`,
  )
  while (true) {
    /*
    const dbCommunities: DbCommunity[] = await DbCommunity.find({
      where: [{ verifiedAt: IsNull() }, { verifiedAt: LessThan('Community.last_announced_at') }],
    })
    */
    const dbCommunities: DbCommunity[] = await DbCommunity.getRepository().manager.query(
      'SELECT * FROM `communities` `Community` WHERE (`Community`.`verified_at` IS NULL OR `Community`.`verified_at` < `Community`.`last_announced_at`)',
    )

    logger.debug(`Federation: found ${dbCommunities.length} dbCommunities`)
    if (dbCommunities) {
      dbCommunities.forEach(async function (dbCom) {
        logger.debug(`Federation: validate publicKey for dbCom: ${JSON.stringify(dbCom)}`)
        const fdCom = new FdCommunity(dbCom)
        const pubKey = await requestGetPublicKey(fdCom)
        logger.debug(`Federation: received publicKey:  ${pubKey}`)
        if (pubKey && pubKey === dbCom.publicKey.toString('hex')) {
          // if (!pubKey) {
          logger.debug(`Federation: matching publicKey:  ${pubKey}`)
          DbCommunity.update({ id: dbCom.id }, { verifiedAt: new Date() })
          logger.debug(`Federation: updated dbCom:  ${JSON.stringify(dbCom)}`)
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

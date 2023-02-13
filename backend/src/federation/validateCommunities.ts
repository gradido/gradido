import { Community as DbCommunity } from '@entity/Community'
import { IsNull } from '@dbTools/typeorm'
// eslint-disable-next-line camelcase
import { requestGetPublicKey as v1_0_requestGetPublicKey } from './client/1_0/FederationClient'
// eslint-disable-next-line camelcase
import { requestGetPublicKey as v1_1_requestGetPublicKey } from './client/1_1/FederationClient'
import { backendLogger as logger } from '@/server/logger'
import { ApiVersionType } from './enum/apiVersionType'
import LogError from '@/server/LogError'

export async function startValidateCommunities(timerInterval: number): Promise<void> {
  logger.info(
    `Federation: startValidateCommunities loop with an interval of ${timerInterval} ms...`,
  )
  // better to use setTimeout twice than setInterval once -> see https://javascript.info/settimeout-setinterval
  setTimeout(function run() {
    validateCommunities()
    setTimeout(run, timerInterval)
  }, timerInterval)
}

export async function validateCommunities(): Promise<void> {
  const dbCommunities: DbCommunity[] = await DbCommunity.createQueryBuilder()
    .where({ foreign: true, verifiedAt: IsNull() })
    .orWhere('verified_at < last_announced_at')
    .getMany()

  logger.debug(`Federation: found ${dbCommunities.length} dbCommunities`)
  dbCommunities.forEach(async function (dbCom) {
    logger.debug(`Federation: dbCom: ${JSON.stringify(dbCom)}`)
    const apiValueStrings: string[] = Object.values(ApiVersionType)
    logger.debug(`suppported ApiVersions=`, apiValueStrings)
    if (apiValueStrings.includes(dbCom.apiVersion)) {
      logger.debug(
        `Federation: validate publicKey for dbCom: ${dbCom.id} with apiVersion=${dbCom.apiVersion}`,
      )
      try {
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
      } catch (err) {
        if (!isLogError(err)) {
          logger.error(`Error:`, err)
        }
      }
    } else {
      logger.warn(
        `Federation: dbCom: ${dbCom.id} with unsupported apiVersion=${dbCom.apiVersion}; supported versions=${apiValueStrings}`,
      )
    }
  })
}

function isLogError(err: any) {
  return err instanceof LogError
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

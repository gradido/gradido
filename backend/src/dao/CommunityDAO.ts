import CONFIG from '@/config'
import { Community as DbCommunity } from '@entity/Community'
import { backendLogger as logger } from '@/server/logger'
import { CommunityFederation as DbFederation } from '@entity/CommunityFederation'
import { CommunityApiVersion as DbApiVersion } from '@entity/CommunityApiVersion'
import { v4 as uuidv4, validate as validateUUID, version as versionUUID } from 'uuid'
import { decryptCommunityPrivateKey, encryptCommunityPrivateKey } from '@/util/encryptionTools'
import { FdCommunity } from '@/federation/graphql/1.0/model/FdCommunity'

export async function readHomeCommunity(): Promise<FdCommunity> {
  const dbCom = await DbCommunity.findOneOrFail({ name: CONFIG.FEDERATE_COMMUNITY_NAME }).catch(
    () => {
      logger.error(`Community with name=${CONFIG.FEDERATE_COMMUNITY_NAME} does not exists`)
      throw new Error(`no HomeCommunity exists`)
    },
  )
  // there is only one federation entry for the home community with foreign flag = false
  const dbFed = await DbFederation.findOneOrFail({ communityId: dbCom.id, foreign: false }).catch(
    () => {
      logger.error(
        `Missing CommunityFederation for Community name=${CONFIG.FEDERATE_COMMUNITY_NAME}`,
      )
      throw new Error(`Missing federation of HomeCommunity`)
    },
  )
  const dbApi = await readNewestApiVersion(dbFed.id)
  const community = new FdCommunity(dbCom.name, dbApi.url, dbCom.description)
  community.id = dbCom.id
  community.name = dbCom.name
  community.description = dbCom.description
  community.uuid = dbCom.uuid
  community.createdAt = dbCom.createdAt
  community.publicKey = dbFed.pubKey.toString('hex')
  community.privKey = decryptCommunityPrivateKey(
    dbFed.privateKey,
    dbCom.uuid,
    CONFIG.FEDERATE_KEY_SECRET,
  ).toString('hex')
  community.url = dbApi.url
  community.apiVersion = dbApi.apiVersion
  community.validFrom = dbApi.validFrom

  return community
}

export async function resetFederationTables(
  name: string,
  url: string,
  descript: string,
  publicKey: Buffer,
  privateKey: Buffer,
): Promise<FdCommunity> {
  // first check if HomeCommunity still exists
  logger.debug(
    `resetFederationTables(${name}, ${url}, ${descript}, ${publicKey.toString('hex')}, 
    ${privateKey.toString('hex')})...`,
  )
  let fdCom: FdCommunity
  // in case a fix UUID is configured, the home community must match the given url and uuid
  if (CONFIG.FEDERATE_COMMUNITY_UUID) {
    try {
      fdCom = await readHomeCommunity()
      logger.debug(`found HomeCommunity: ${JSON.stringify(fdCom)}`)
      if (url === fdCom.url && CONFIG.FEDERATE_COMMUNITY_UUID === fdCom.uuid) {
        logger.debug(`configured HomeCommunity still exists`)
        await deleteForeignFedComAndApiVersionEntries()
        return fdCom
      }
    } catch {
      logger.info(`no HomeCommunity found in database, create it per configured properties...`)
    }
  }

  // TODO clearing community-table not allowed as soon as other attributes than federation exists in it
  DbCommunity.clear()
  DbFederation.clear()
  DbApiVersion.clear()
  logger.debug(`all federation tabels cleared...`)

  let dbCom = DbCommunity.create()
  dbCom.name = name
  dbCom.description = descript
  dbCom.uuid = CONFIG.FEDERATE_COMMUNITY_UUID || uuidv4()
  dbCom = await dbCom.save()

  let dbFed = DbFederation.create()
  dbFed.communityId = dbCom.id
  dbFed.uuid = dbCom.uuid
  dbFed.foreign = false
  dbFed.privateKey = encryptCommunityPrivateKey(privateKey, dbCom.uuid, CONFIG.FEDERATE_KEY_SECRET)
  dbFed.pubKey = publicKey
  dbFed = await dbFed.save()

  let dbApi = DbApiVersion.create()
  dbApi.communityFederationID = dbFed.id
  dbApi.apiVersion = '1.0'
  dbApi.url = url
  dbApi.validFrom = new Date()
  dbApi = await dbApi.save()
  logger.debug(`new HomeCommunity created...`)

  const community = new FdCommunity(name, url, descript, dbFed, dbApi)
  community.id = dbCom.id
  community.uuid = dbCom.uuid
  community.createdAt = dbCom.createdAt
  community.publicKey = publicKey.toString('hex')
  community.privKey = dbFed.privateKey.toString('hex')
  logger.debug(`create new HomeCommunity=${JSON.stringify(community)} successfully`)
  return community
}

export async function addFederationCommunity(
  remotePublicKey: Buffer,
  remoteApiVersion: string,
  remoteUrl: string,
): Promise<boolean> {
  logger.info(
    `addFederationCommunity(remotePublicKey=${remotePublicKey.toString(
      'hex',
    )}, remoteApiVersion=${remoteApiVersion}, remoteUrl=${remoteUrl}, )...`,
  )
  const dbCom = await DbCommunity.findOneOrFail({ name: CONFIG.FEDERATE_COMMUNITY_NAME }).catch(
    () => {
      logger.error(`Community with name=${CONFIG.FEDERATE_COMMUNITY_NAME} does not exists`)
      throw new Error(`Community with name=${CONFIG.FEDERATE_COMMUNITY_NAME} does not exists`)
    },
  )
  let dbFed = await DbFederation.findOneOrFail({
    communityId: dbCom.id,
    foreign: true,
    pubKey: remotePublicKey,
  }).catch(async () => {
    logger.info(`FedCom does not exists -> a new RemoteCommunity will be added...`)
  })
  if (!dbFed) {
    if (!(await checkForExistingApiUrl(remoteUrl))) {
      dbFed = DbFederation.create()
      dbFed.communityId = dbCom.id
      dbFed.foreign = true
      dbFed.pubKey = remotePublicKey
      dbFed = await dbFed.save()
      logger.info(`new dbFed stored: ${JSON.stringify(dbFed)}`)

      let dbApi = DbApiVersion.create()
      dbApi.communityFederationID = dbFed.id
      dbApi.apiVersion = remoteApiVersion
      dbApi.url = remoteUrl
      dbApi.validFrom = new Date()
      dbApi = await dbApi.save()
      logger.info(`new dbApi stored: ${JSON.stringify(dbApi)}`)

      return true
    } else {
      logger.info(`FedCom with Url still exists...`)
    }
  }
  logger.info(`FedCom with publicKey still exists...`)
  return false
}

export async function readFederationCommunityByPubKey(publicKey: string): Promise<FdCommunity> {
  logger.debug(`readFederationCommunityByPubKey(publicKey=${publicKey})...`)
  const pubKeyBuf = Buffer.from(publicKey, 'hex')
  const dbFed = await DbFederation.findOneOrFail({ pubKey: pubKeyBuf, foreign: true }).catch(() => {
    logger.error(`unknown CommunityFederation for pubKey=${publicKey}`)
    throw new Error(`unknown CommunityFederation for pubKey`)
  })
  const dbApi = await readNewestApiVersion(dbFed.id)
  const community = new FdCommunity('unknown', 'unknown', 'unknown', dbFed, dbApi)
  logger.debug(`readFederationCommunityByPubKey(${publicKey})...successful`)
  return community
}

export async function readFederationCommunityByUrl(url: string): Promise<FdCommunity> {
  logger.debug(`readFederationCommunityByUrl(url=${url})...`)
  const dbApi = await readNewestApiVersionByUrl(url)
  const dbFed = await DbFederation.findOneOrFail({
    id: dbApi.communityFederationID,
    foreign: true,
  }).catch(() => {
    logger.error(`unknown CommunityFederation for url=${url}`)
    throw new Error(`unknown CommunityFederation for url`)
  })
  const community = new FdCommunity('unknown', 'unknown', 'unknown', dbFed, dbApi)
  logger.debug(`readFederationCommunityByUrl(${url})...successful`)
  return community
}

async function readNewestApiVersion(fedId: number): Promise<DbApiVersion> {
  logger.debug(`readNewestApiVersion(fedId=${fedId})...`)
  // read the entries with the youngest ValidFrom at first
  const dbApi = await DbApiVersion.find({
    where: { communityFederationID: fedId },
    order: { validFrom: 'DESC' },
  })

  if (!dbApi || !dbApi[0]) {
    logger.error(
      `Community with malformed configuration! missing ApiVersion for federationid=${fedId}`,
    )
    throw new Error(`Community with malformed configuration!`)
  }
  logger.debug(`readNewestApiVersion(fedId=${fedId})...successful: apiVersion=${dbApi[0]}`)
  return dbApi[0]
}

async function readNewestApiVersionByUrl(url: string): Promise<DbApiVersion> {
  logger.debug(`readNewestApiVersionByUrl(url=${url})...`)
  // read the entries with the youngest ValidFrom at first
  const dbApi = await DbApiVersion.find({
    where: { url: url },
    order: { validFrom: 'DESC' },
  })

  if (!dbApi || !dbApi[0]) {
    logger.error(
      `Community with malformed configuration! missing ApiVersion for federation-url=${url}`,
    )
    throw new Error(`Community with malformed configuration!`)
  }
  logger.debug(`readNewestApiVersion(url=${url})...successful: apiVersion=${dbApi[0]}`)
  return dbApi[0]
}

export async function setFedComPubkeyVerifiedAt(
  comId: number,
  remotePubKey: string,
): Promise<boolean> {
  logger.debug(`setFedComPubkeyVerifiedAt(comId=${comId}, remotePubKey=${remotePubKey})...`)
  const pubKeyBuf = Buffer.from(remotePubKey, 'hex')
  const dbFed = await DbFederation.findOneOrFail({
    communityId: comId,
    pubKey: pubKeyBuf,
    foreign: true,
  }).catch(async () => {
    logger.error(`Federated Community with publicKey=${remotePubKey} does not exists`)
  })
  if (dbFed) {
    dbFed.pubKeyVerifiedAt = new Date()
    logger.debug(`dbFed set pubkeyVerifiedAt=${dbFed.pubKeyVerifiedAt.toISOString()}`)
    await DbFederation.save(dbFed)
    /*
    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('REPEATABLE READ')
    dbFed.pubKeyVerifiedAt = new Date()
    DbFederation.save(dbFed)
    logger.debug(`dbFed set pubkeyVerifiedAt=${dbFed.pubKeyVerifiedAt.toISOString()}`)
    try {
      // Save user
      await queryRunner.manager.save(dbFed).catch((error) => {
        logger.error('error saving federate community: ' + error)
        throw new Error('error saving federate community: ' + error)
      })
      await queryRunner.commitTransaction()
      logger.info('Federated Community data updated successfully...')
    } catch (e) {
      await queryRunner.rollbackTransaction()
      logger.error('Error on writing federate community data:' + e)
      throw e
    } finally {
      await queryRunner.release()
    }
    */
  }
  logger.debug(
    `setFedComPubkeyVerifiedAt(comId=${comId}, remotePubKey=${remotePubKey})...successful`,
  )
  return true
}

async function checkForExistingApiUrl(remoteUrl: string): Promise<boolean> {
  // read the entries with the youngest ValidFrom at first
  const dbApi = await DbApiVersion.find({
    where: { url: remoteUrl },
  })

  if (dbApi && dbApi[0]) {
    logger.info(`federated Community with url=${remoteUrl} still exists`)
    return true
  }
  return false
}

export async function deleteForeignFedComAndApiVersionEntries(fedComId?: number) {
  logger.debug(`deleteForeignFedComAndApiVersionEntries(fedComId=${fedComId})...`)
  let fedComs: DbFederation[]
  if (fedComId) {
    fedComs = await DbFederation.find({ id: fedComId, foreign: true })
  } else {
    fedComs = await DbFederation.find({ foreign: true })
  }
  fedComs.forEach(async (fedCom) => {
    const apiVersions = await DbApiVersion.find({ communityFederationID: fedCom.id })
    apiVersions.forEach(async (apiVer) => {
      await apiVer.remove()
    })
    await fedCom.remove()
  })
  logger.debug(`deleteForeignFedComAndApiVersionEntries()...successful`)
}

export async function setFedComUUID(fedCom: FdCommunity): Promise<boolean> {
  logger.debug(`setFedComUUID(fedCom=${JSON.stringify(fedCom)})...`)
  const dbFed = await DbFederation.findOneOrFail({
    id: fedCom.id,
    foreign: true,
  }).catch(async () => {
    logger.error(`Federated Community with id=${fedCom.id} does not exists`)
  })
  if (dbFed) {
    dbFed.uuid = fedCom.uuid
    logger.debug(`dbFed set UUID=${dbFed.uuid}`)
    // only set authenticatedAt in case the uuid is a valid V4-UUID
    if (validateUUID(dbFed.uuid) && versionUUID(dbFed.uuid) === 4) {
      dbFed.authenticatedAt = new Date()
    }
    await DbFederation.save(dbFed)
    logger.debug(`setFedComUUID()...successful`)
    return true
  }
  logger.error(`setFedComUUID()...FAIL`)
  return false
}

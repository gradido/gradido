import CONFIG from '@/config'
import { Community as DbCommunity } from '@entity/Community'
import { backendLogger as logger } from '@/server/logger'
import { CommunityFederation as DbFederation } from '@entity/CommunityFederation'
import { CommunityApiVersion as DbApiVersion } from '@entity/CommunityApiVersion'
import { v4 as uuidv4, validate as validateUUID, version as versionUUID } from 'uuid'
import { createKeyPair } from '@/util/encryptionTools'
import { FdCommunity } from '@/federation/graphql/v0/model/FdCommunity'
import { getConnection } from '@dbTools/typeorm'

export async function readHomeCommunity(): Promise<FdCommunity> {
  logger.debug(`readHomeCommunity()...`)
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
  community.authenticatedAt = dbFed.authenticatedAt
  community.publicKey = dbFed.publicKey.toString('hex')
  community.privKey = dbFed.privateKey.toString('hex')
  community.dhtPublicKey = dbFed.dhtPublicKey.toString('hex')
  community.dhtSecretKey = dbFed.dhtSecretKey.toString('hex')
  community.dhtVerifiedAt = dbFed.dhtPubKeyVerifiedAt || null
  community.url = dbApi.url
  community.apiVersion = dbApi.apiVersion
  community.validFrom = dbApi.validFrom
  logger.debug(`readHomeCommunity()...successful: ${JSON.stringify(community)}`)

  return community
}

export async function resetFederationTables(
  name: string,
  url: string,
  descript: string,
  dhtPublicKey: any,
  dhtSecretKey: any,
): Promise<FdCommunity> {
  // first check if HomeCommunity still exists
  logger.debug(`resetFederationTables(${name}, ${url}, ${descript}`) //, ${publicKey.toString('hex')}, ${privateKey.toString('hex')})...`,

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

  /*
  const queryRunner = getConnection().createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction('REPEATABLE READ')
  try {
  */
  let dbCom = DbCommunity.create()
  dbCom.name = name
  dbCom.description = descript
  dbCom.uuid = CONFIG.FEDERATE_COMMUNITY_UUID || uuidv4()
  dbCom = await DbCommunity.save(dbCom)
  /*
  dbCom = await queryRunner.manager.save(dbCom).catch((error) => {
    logger.error('Error while saving dbCom', error)
    throw new Error('error saving Community')
  })
  */
  const comKeyPair = await createKeyPair(dbCom.uuid)
  logger.debug(`Com.keyPair: publicKey=${comKeyPair.publicKey.toString('hex')}`)
  logger.debug(`Com.keyPair: secretKey=${comKeyPair.secretKey.toString('hex')}`)
  // const dhtKeyPair = await createDHTKeyPair(dbCom.uuid)
  // logger.debug(`DHT.keyPair: publicKey=${dhtKeyPair.publicKey.toString('hex')}`)
  // logger.debug(`DHT.keyPair: secretKey=${dhtKeyPair.secretKey.toString('hex')}`)

  let dbFed = DbFederation.create()
  dbFed.communityId = dbCom.id
  dbFed.uuid = dbCom.uuid
  dbFed.foreign = false
  dbFed.privateKey = comKeyPair.secretKey
  dbFed.publicKey = comKeyPair.publicKey
  dbFed.dhtSecretKey = dhtSecretKey
  dbFed.dhtPublicKey = dhtPublicKey
  dbFed = await DbFederation.save(dbFed)
  /*
  dbFed = await queryRunner.manager.save(dbFed).catch((error) => {
    logger.error('Error while saving dbFed', error)
    throw new Error('error saving FederationCommunity')
  })
  */
  let dbApi = DbApiVersion.create()
  dbApi.communityFederationID = dbFed.id
  dbApi.apiVersion = CONFIG.FEDERATE_COMMUNITY_APIVERSION
  dbApi.url = url
  dbApi.validFrom = new Date()
  dbApi = await DbApiVersion.save(dbApi)
  /*
  dbApi = await queryRunner.manager.save(dbApi).catch((error) => {
    logger.error('Error while saving dbApi', error)
    throw new Error('error saving CommunityApiVersion')
  })
  */
  logger.debug(`new HomeCommunity created...`)

  const community = new FdCommunity(name, url, descript, dbFed, dbApi)
  community.id = dbCom.id
  community.uuid = dbCom.uuid
  community.createdAt = dbCom.createdAt
  community.publicKey = comKeyPair.publicKey
  community.privKey = comKeyPair.secretKey
  community.dhtPublicKey = dhtPublicKey
  community.dhtSecretKey = dhtSecretKey
  logger.debug(`create new HomeCommunity=${JSON.stringify(community)} successfully`)
  return community
  /*  
  } catch (e) {
    logger.error(`error during reset federation tables with ${e}`)
    await queryRunner.rollbackTransaction()
    throw e
  } finally {
    await queryRunner.release()
  }
  */
}

export async function addFederationCommunity(
  remoteDhtPublicKey: Buffer,
  remoteApiVersion: string,
  remoteUrl: string,
): Promise<boolean> {
  logger.info(
    `addFederationCommunity(remotePublicKey=${remoteDhtPublicKey.toString(
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
    dhtPublicKey: remoteDhtPublicKey,
  }).catch(async () => {
    logger.info(`FedCom with this dhtPublicKey does not exists...`)
  })
  if (!dbFed) {
    if (!(await checkForExistingApiUrl(remoteUrl))) {
      logger.debug(`add new federated Community...`)
      /*
      const queryRunner = getConnection().createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction('REPEATABLE READ')
      try {
      */
      dbFed = DbFederation.create()
      dbFed.communityId = dbCom.id
      dbFed.foreign = true
      dbFed.dhtPublicKey = remoteDhtPublicKey
      dbFed = await DbFederation.save(dbFed)
      /*
      dbFed = await queryRunner.manager.save(dbFed).catch((error) => {
        logger.error('Error while saving dbFed', error)
        throw new Error('error saving FederationCommunity')
      })
      */
      logger.debug(`new dbFed stored: ${JSON.stringify(dbFed)}`)

      let dbApi = DbApiVersion.create()
      dbApi.communityFederationID = dbFed.id
      dbApi.apiVersion = remoteApiVersion
      dbApi.url = remoteUrl
      dbApi.validFrom = new Date()
      dbApi = await DbApiVersion.save(dbApi)
      /*
      dbApi = await queryRunner.manager.save(dbApi).catch((error) => {
        logger.error('Error while saving dbApi', error)
        throw new Error('error saving CommunityApiVersion')
      })
      */
      logger.debug(`new dbApi stored: ${JSON.stringify(dbApi)}`)
      return true
      /*  
      } catch (e) {
        logger.error(`error during reset federation tables with ${e}`)
        await queryRunner.rollbackTransaction()
        throw e
      } finally {
        await queryRunner.release()
      }
      */
    } else {
      logger.error(`Another FedCom with Url ${remoteUrl} still exists...`)
      return false
    }
  }
  if (!dbFed.dhtPubKeyVerifiedAt) {
    logger.info(`the publicKey of the existing federated Community is still not verified...`)
    return true
  }
  logger.info(`FedCom with publicKey still exists and is verified...`)
  return false
}

export async function readFederationCommunityByDhtPubKey(
  dhtPublicKey: Buffer,
): Promise<FdCommunity> {
  logger.debug(
    `readFederationCommunityByDhtPubKey(dhtPublicKey=${dhtPublicKey.toString('hex')})...`,
  )
  const dbFed = await DbFederation.findOneOrFail({
    dhtPublicKey: dhtPublicKey,
    foreign: true,
  }).catch(() => {
    logger.error(`unknown CommunityFederation for dhtPublicKey=${dhtPublicKey.toString('hex')}`)
    throw new Error(`unknown CommunityFederation for dhtPublicKey`)
  })
  const dbApi = await readNewestApiVersion(dbFed.id)
  logger.debug(`found dbFed=${JSON.stringify(dbFed)} and dbApi=${JSON.stringify(dbApi)}`)
  const community = new FdCommunity('unknown', 'unknown', 'unknown', dbFed, dbApi)
  logger.debug(`readFederationCommunityByPubKey()...successful`)
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
  logger.debug(
    `readNewestApiVersion(fedId=${fedId})...successful: apiVersion=${JSON.stringify(dbApi[0])}`,
  )
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
  dbApi.forEach((dba) => {
    if (dba.communityFederationID !== dbApi[0].communityFederationID) {
      logger.error(
        `found ApiVersions of different FederationCommunities ${dba.communityFederationID} != ${dbApi[0].communityFederationID}`,
      )
      throw new Error(`found ApiVersions of different FederationCommunities!`)
    }
  })
  logger.debug(`readNewestApiVersion(url=${url})...successful: apiVersion=${dbApi[0]}`)
  return dbApi[0]
}

export async function setFedComDhtPubkeyVerifiedAt(
  remoteDhtPubKey: Buffer,
  verifiedDate: Date | null,
): Promise<boolean> {
  logger.debug(
    `setFedComDhtPubkeyVerifiedAt(remoteDhtPubKey=${remoteDhtPubKey.toString('hex')})...`,
  )
  const dbFed = await DbFederation.findOneOrFail({
    dhtPublicKey: remoteDhtPubKey,
    foreign: true,
  }).catch(async () => {
    logger.error(`Federated Community with publicKey=${remoteDhtPubKey} does not exists`)
  })
  if (dbFed) {
    dbFed.dhtPubKeyVerifiedAt = verifiedDate
    logger.debug(
      `dbFed set dhtPubKeyVerifiedAt=${
        dbFed.dhtPubKeyVerifiedAt ? dbFed.dhtPubKeyVerifiedAt.toISOString() : 'null'
      }`,
    )
    await DbFederation.save(dbFed)
  }
  logger.info(`setFedComDhtPubkeyVerifiedAt()...successful`)
  return true
}

async function checkForExistingApiUrl(remoteUrl: string): Promise<boolean> {
  logger.debug(`checkForExistingApiUrl(${remoteUrl})...`)
  // read the entries with the youngest ValidFrom at first
  const dbApi = await DbApiVersion.find({
    where: { url: remoteUrl },
  })

  if (dbApi && dbApi[0]) {
    logger.debug(`${dbApi.length} federated Communit(y/ies) with the url=${remoteUrl} still exists`)
    return true
  }
  logger.debug(`no federated Community with the url=${remoteUrl} found`)
  return false
}

export async function deleteForeignFedComAndApiVersionEntries(fedComId?: number): Promise<void> {
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
      await DbApiVersion.remove(apiVer)
    })
    await DbFederation.remove(fedCom)
  })
  logger.info(`deleteForeignFedComAndApiVersionEntries()...successful`)
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
      logger.debug(`dbFed set authenticatedAt=${dbFed.authenticatedAt.toISOString()}`)
    }
    await DbFederation.save(dbFed)
    logger.info(`setFedComUUID()...successful`)
    return true
  }
  logger.error(`setFedComUUID()...FAIL`)
  return false
}

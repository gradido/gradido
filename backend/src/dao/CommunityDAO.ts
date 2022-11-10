import CONFIG from '@/config'
import { Community as DbCommunity } from '@entity/Community'
import { backendLogger as logger } from '@/server/logger'
import {
  CommunityFederation,
  CommunityFederation as DbFederation,
} from '@entity/CommunityFederation'
import { CommunityApiVersion as DbApiVersion } from '@entity/CommunityApiVersion'
import { v4 as uuidv4 } from 'uuid'
import { FdCommunity } from '@/federation/model/FdCommunity'
import { decryptCommunityPrivateKey, encryptCommunityPrivateKey } from '@/util/encryptionTools'

export async function readHomeCommunity(): Promise<FdCommunity> {
  const dbCom = await DbCommunity.findOneOrFail({ name: CONFIG.COMMUNITY_NAME }).catch(() => {
    logger.error(`Community with name=${CONFIG.COMMUNITY_NAME} does not exists`)
    throw new Error(`no HomeCommunity exists`)
  })
  // there is only one federation entry for the home community with foreign flag = false
  const dbFed = await DbFederation.findOneOrFail({ communityId: dbCom.id, foreign: false }).catch(
    () => {
      logger.error(`Missing CommunityFederation for Community name=${CONFIG.COMMUNITY_NAME}`)
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
    CONFIG.LOGIN_SERVER_KEY,
  ).toString('hex')
  community.url = dbApi.url
  community.apiVersion = dbApi.apiVersion
  community.validFrom = dbApi.validFrom

  return community
}

export async function createHomeCommunity(
  name: string,
  url: string,
  descript: string,
  publicKey: Buffer,
  privateKey: Buffer,
): Promise<FdCommunity> {
  // first check if HomeCommunity still exists
  logger.debug(
    `createHomeCommunity(${name}, ${url}, ${descript}, ${publicKey.toString('hex')}, 
    ${privateKey.toString('hex')})...`,
  )
  try {
    const fdCom = await readHomeCommunity()
    logger.debug(`found HomeCommunity: ${JSON.stringify(fdCom)}`)
    if (url === fdCom.url) {
      logger.debug(`configured HomeCommunity still exists`)
      return fdCom
    }
  } catch {
    logger.info(`no HomeCommunity found in database...`)
  }
  // start federation with empty federation tables
  DbCommunity.clear()
  DbFederation.clear()
  DbApiVersion.clear()
  logger.debug(`all federation tabels cleared...`)

  let dbCom = DbCommunity.create()
  dbCom.name = name
  dbCom.description = descript
  dbCom.uuid = uuidv4()
  dbCom = await dbCom.save()

  let dbFed = DbFederation.create()
  dbFed.communityId = dbCom.id
  dbFed.uuid = dbCom.uuid
  dbFed.foreign = false
  dbFed.privateKey = encryptCommunityPrivateKey(privateKey, dbCom.uuid, CONFIG.LOGIN_SERVER_KEY)
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
  community.privKey = dbFed.privateKey.toString('hex')
  logger.debug(`new homecommunity=${JSON.stringify(community)} created successfully`)
  return community
}

export async function addUnknownFederationCommunity(
  remotePublicKey: Buffer,
  remoteApiVersion: string,
  remoteUrl: string,
): Promise<boolean> {
  logger.info(`addUnknownFederationCommunity()...`)
  const dbCom = await DbCommunity.findOneOrFail({ name: CONFIG.COMMUNITY_NAME }).catch(() => {
    logger.error(`Community with name=${CONFIG.COMMUNITY_NAME} does not exists`)
    throw new Error(`Community with name=${CONFIG.COMMUNITY_NAME} does not exists`)
  })
  await DbFederation.findOneOrFail({
    communityId: dbCom.id,
    foreign: true,
    pubKey: remotePublicKey,
  }).catch(async () => {
    logger.info(
      `add unknown RemoteCommunity with pubKey=${remotePublicKey}, url=${remoteUrl}, api=${remoteApiVersion}`,
    )
    const dbFed = DbFederation.create()
    dbFed.communityId = dbCom.id
    dbFed.foreign = true
    dbFed.pubKey = remotePublicKey
    await dbFed.save()

    let dbApi = DbApiVersion.create()
    dbApi.communityFederationID = dbFed.id
    dbApi.apiVersion = remoteApiVersion
    dbApi.url = remoteUrl
    dbApi.validFrom = new Date()
    dbApi = await dbApi.save()

    return true
  })
  return false
}

export async function readFederationCommunity(publicKey: string): Promise<FdCommunity> {
  logger.debug(`readFederationCommunity(${publicKey})...`)
  const pubKeyBuf = Buffer.from(publicKey, 'hex')
  const dbFed = await DbFederation.findOneOrFail({ pubKey: pubKeyBuf, foreign: true }).catch(() => {
    logger.error(`unknown CommunityFederation for pubKey=${publicKey}`)
    throw new Error(`unknown CommunityFederation for pubKey`)
  })
  const dbApi = await readNewestApiVersion(dbFed.id)
  const community = new FdCommunity('unknown', 'unknown', 'unknown', dbFed, dbApi)
  logger.debug(
    `readFederationCommunity(${publicKey})...sccessful: community=${JSON.stringify(community)}`,
  )
  return community
}

async function readNewestApiVersion(fedId: number): Promise<DbApiVersion> {
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
  return dbApi[0]
}

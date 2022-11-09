import CONFIG from '@/config'
import { Community as DbCommunity } from '@entity/Community'
import { backendLogger as logger } from '@/server/logger'
import { CommunityFederation as DbFederation } from '@entity/CommunityFederation'
import { CommunityApiVersion as DbApiVersion } from '@entity/CommunityApiVersion'
import { v4 as uuidv4 } from 'uuid'
import { Community as FdCommunity } from '@/federation/model/Community'
import { decryptCommunityPrivateKey, encryptCommunityPrivateKey } from '@/util/encryptionTools'

export async function readHomeCommunity(): Promise<FdCommunity> {
  const dbCom = await DbCommunity.findOneOrFail({ name: CONFIG.COMMUNITY_NAME }).catch(() => {
    logger.error(`Community with name=${CONFIG.COMMUNITY_NAME} does not exists`)
    throw new Error(`Community with name=${CONFIG.COMMUNITY_NAME} does not exists`)
  })
  // there is only one federation entry for the home community with foreign flag = false
  const dbFed = await DbFederation.findOneOrFail({ communityId: dbCom.id, foreign: false }).catch(
    () => {
      logger.error(`Community with name=${CONFIG.COMMUNITY_NAME} does not exists`)
      throw new Error(`Community with name=${CONFIG.COMMUNITY_NAME} does not exists`)
    },
  )
  // read the entries with the youngest ValidFrom at first
  const dbApi = await DbApiVersion.find({
    where: { communityFederationID: dbFed.id },
    order: { validFrom: 'DESC' },
  })

  if (!dbApi || !dbApi[0]) {
    logger.error(
      `HomeCommunity with malformed configuration! missing ApiVersion for federationid=${dbFed.id}`,
    )
    throw new Error(
      `HomeCommunity with malformed configuration! missing ApiVersion for federationid=${dbFed.id}`,
    )
  }

  const community = new FdCommunity(dbCom.name, dbApi[0].url, dbCom.description)
  community.id = dbCom.id
  community.name = dbCom.name
  community.description = dbCom.description
  community.uuid = dbCom.uuid
  community.createdAt = dbCom.createdAt
  community.publicKey = dbFed.pubKey
  community.privKey = decryptCommunityPrivateKey(
    dbFed.privateKey,
    dbCom.uuid,
    CONFIG.LOGIN_SERVER_KEY,
  )
  community.url = dbApi[0].url
  community.apiVersion = dbApi[0].apiVersion
  community.validFrom = dbApi[0].validFrom

  return community
}

export async function createHomeCommunity(
  name: string,
  url: string,
  descript: string,
  publicKey: Buffer,
  privateKey: Buffer,
): Promise<FdCommunity> {
  // start federation with empty federation tables
  DbCommunity.clear()
  DbFederation.clear()
  DbApiVersion.clear()

  let dbCom = DbCommunity.create()
  dbCom.name = name
  dbCom.description = descript
  dbCom.uuid = uuidv4()
  dbCom = await dbCom.save()

  let dbFed = DbFederation.create()
  dbFed.communityId = dbCom.id
  dbFed.foreign = false
  dbFed.privateKey = encryptCommunityPrivateKey(privateKey, dbCom.uuid, CONFIG.LOGIN_SERVER_KEY)
  dbFed.pubKey = publicKey.
  dbFed = await dbFed.save()

  let dbApi = DbApiVersion.create()
  dbApi.communityFederationID = dbFed.id
  dbApi.apiVersion = '1.0'
  dbApi.url = url
  dbApi.validFrom = new Date()
  dbApi = await dbApi.save()

  const community = new FdCommunity(name, url, descript)
  community.id = dbCom.id
  community.uuid = dbCom.uuid
  community.createdAt = dbCom.createdAt
  community.privKey = dbFed.privateKey
  community.publicKey = dbFed.pubKey
  community.apiVersion = dbApi.apiVersion
  community.validFrom = dbApi.validFrom

  return community
}

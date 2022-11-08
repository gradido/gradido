import CONFIG from '@/config'
import { Community as DbCommunity } from '@entity/Community'
import { backendLogger as logger } from '@/server/logger'
import { Community } from '@/graphql/model/Community'
import { CommunityFederation as DbFederation } from '@entity/CommunityFederation'
import { CommunityApiVersion as DbApiVersion } from '@entity/CommunityApiVersion'

export async function readHomeCommunity(): Promise<Community> {
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

  const community = new Community()
  community.id = dbCom.id
  community.name = dbCom.name
  community.description = dbCom.description
  community.uuid = dbCom.uuid
  community.createdAt = dbCom.createdAt
  if (dbApi) {
    community.url = dbApi[0].url
    community.apiVersion = dbApi[0].apiVersion
    community.validFrom = dbApi[0].validFrom
  }

  return community
}

/*
export async function createHomeCommunity(community: Community): Promise<Community> {
  const dbCom = DbCommunity.create()
  dbCom.name = community.name
  dbCom.description = community.description
  dbCom.
}
*/

import fs from 'node:fs'
import path from 'node:path'
import { Mutex } from 'async-mutex'
import { getLogger } from 'log4js'
import { CONFIG } from '../../config'
import { GRADIDO_NODE_HOME_FOLDER_NAME, LOG4JS_BASE_CATEGORY } from '../../config/const'
import { HieroId } from '../../schemas/typeGuard.schema'
import { checkFileExist, checkPathExist } from '../../utils/filesystem'
import { BackendClient } from '../backend/BackendClient'
import { GradidoNodeProcess } from './GradidoNodeProcess'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.client.GradidoNode.communities`)
const ensureCommunitiesAvailableMutex: Mutex = new Mutex()

// prototype, later add api call to gradido dlt node server for adding/updating communities
type CommunityForDltNodeServer = {
  communityId: string
  hieroTopicId: string
  alias: string
  folder: string
}

export async function ensureCommunitiesAvailable(communityTopicIds: HieroId[]): Promise<void> {
  const release = await ensureCommunitiesAvailableMutex.acquire()
  try {
    const homeFolder = path.join(
      CONFIG.DLT_GRADIDO_NODE_SERVER_HOME_FOLDER,
      GRADIDO_NODE_HOME_FOLDER_NAME,
    )
    const communityTopicIdsSet = new Set(communityTopicIds)
    if (!checkCommunityAvailable(communityTopicIdsSet, homeFolder)) {
      await exportCommunities(homeFolder, BackendClient.getInstance())
      return GradidoNodeProcess.getInstance().restart()
    }
  } finally {
    release()
  }
}

export async function exportCommunities(homeFolder: string, client: BackendClient): Promise<void> {
  const communities = await client.getReachableCommunities()
  const communitiesPath = path.join(homeFolder, 'communities.json')
  checkPathExist(path.dirname(communitiesPath), true)
  // make sure communityName is unique
  const communityName = new Set<string>()
  const communitiesForDltNodeServer: CommunityForDltNodeServer[] = []
  for (const com of communities) {
    if (!com.uuid || !com.hieroTopicId) {
      continue
    }
    // use name as alias if not empty and unique, otherwise use uuid
    let alias = com.name
    if (!alias || communityName.has(alias)) {
      alias = com.uuid
    }
    communityName.add(alias)
    communitiesForDltNodeServer.push({
      communityId: com.uuid,
      hieroTopicId: com.hieroTopicId,
      alias,
      // use only alpha-numeric chars for folder name
      folder: alias.replace(/[^a-zA-Z0-9]/g, '_'),
    })
  }
  fs.writeFileSync(communitiesPath, JSON.stringify(communitiesForDltNodeServer, null, 2))
  logger.info(`exported ${communitiesForDltNodeServer.length} communities to ${communitiesPath}`)
}

export function checkCommunityAvailable(communityTopicIds: Set<HieroId>, homeFolder: string): boolean {
  const communitiesPath = path.join(homeFolder, 'communities.json')
  if (!checkFileExist(communitiesPath)) {
    return false
  }
  const communities = JSON.parse(fs.readFileSync(communitiesPath, 'utf-8'))
  let foundCount = 0
  for (const community of communities) {
    if (communityTopicIds.has(community.hieroTopicId)) {
      foundCount++
      if (foundCount >= communityTopicIds.size) {
        return true
      }
    }
  }
  logger.debug(`community not found for topic ids: ${communityTopicIds}, communities: ${JSON.stringify(communities, null, 2)}`)
  return false
}

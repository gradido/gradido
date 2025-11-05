import { Context } from './Context'
import { CommunityContext } from './Context'
import { loadCommunities } from './database'
import { HieroId, hieroIdSchema } from '../../schemas/typeGuard.schema'
import * as v from 'valibot'
import { InMemoryBlockchainProvider } from 'gradido-blockchain-js'
import { generateKeyPairCommunity } from './keyPair'
import { communityDbToCommunity } from './convert'
import { addCommunityRootTransaction } from './blockchain'

export async function bootstrap(): Promise<Context> {
  const context = await Context.create()
  context.communities = await bootstrapCommunities(context)
  return context
}

async function bootstrapCommunities(context: Context): Promise<Map<string, CommunityContext>> {
  const communities = new Map<string, CommunityContext>()
  const communitiesDb = await loadCommunities(context.db)
  const topicIds = new Set<HieroId>()
  
  for (const communityDb of communitiesDb) {
    const blockchain = InMemoryBlockchainProvider.getInstance().findBlockchain(communityDb.uniqueAlias)
    if (!blockchain) {
      throw new Error(`Couldn't create Blockchain for community ${communityDb.communityUuid}`)
    }
    context.logger.info(`Blockchain for community '${communityDb.uniqueAlias}' created`)
    // make sure topic id is unique
    let topicId: HieroId 
    do {
      topicId = v.parse(hieroIdSchema, '0.0.' + Math.floor(Math.random() * 10000))
    } while(topicIds.has(topicId))
    topicIds.add(topicId)

    communities.set(communityDb.communityUuid, {
      communityId: communityDb.uniqueAlias,
      blockchain,
      topicId
    })
    
    generateKeyPairCommunity(communityDb, context.cache, topicId)
    // create community root transaction 1 minute before first user
    const creationDate = new Date(new Date(communityDb.userMinCreatedAt).getTime() - 1000 * 60)
    // community from db to community format the dlt connector normally uses
    const community = communityDbToCommunity(topicId, communityDb, creationDate)
    await addCommunityRootTransaction(blockchain, community)
  }
  return communities
}

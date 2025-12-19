import { AccountBalance, AccountBalances, GradidoUnit, InMemoryBlockchainProvider } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { GradidoBlockchainCryptoError } from '../../errors'
import { ResolveKeyPair } from '../../interactions/resolveKeyPair/ResolveKeyPair.context'
import { HieroId, hieroIdSchema } from '../../schemas/typeGuard.schema'
import { AUF_ACCOUNT_DERIVATION_INDEX, GMW_ACCOUNT_DERIVATION_INDEX, hardenDerivationIndex } from '../../utils/derivationHelper'
import { addCommunityRootTransaction } from './blockchain'
import { Context } from './Context'
import { communityDbToCommunity } from './convert'
import { loadAdminUsersCache, loadCommunities, loadContributionLinkModeratorCache } from './database'
import { generateKeyPairCommunity } from './data/keyPair'
import { CommunityContext } from './valibot.schema'
import { Balance } from './data/Balance'

export async function bootstrap(): Promise<Context> {
  const context = await Context.create()
  context.communities = await bootstrapCommunities(context)
  await Promise.all([
    loadContributionLinkModeratorCache(context.db),
    loadAdminUsersCache(context.db)
  ])
  return context
}

async function bootstrapCommunities(context: Context): Promise<Map<string, CommunityContext>> {
  const communities = new Map<string, CommunityContext>()
  const communitiesDb = await loadCommunities(context.db)
  const topicIds = new Set<HieroId>()

  for (const communityDb of communitiesDb) {
    const blockchain = InMemoryBlockchainProvider.getInstance().findBlockchain(
      communityDb.uniqueAlias,
    )
    if (!blockchain) {
      throw new Error(`Couldn't create Blockchain for community ${communityDb.communityUuid}`)
    }
    context.logger.info(`Blockchain for community '${communityDb.uniqueAlias}' created`)
    // make sure topic id is unique
    let topicId: HieroId
    do {
      topicId = v.parse(hieroIdSchema, '0.0.' + Math.floor(Math.random() * 10000))
    } while (topicIds.has(topicId))
    topicIds.add(topicId)

    communities.set(communityDb.communityUuid, {
      communityId: communityDb.uniqueAlias,
      blockchain,
      topicId,
      folder: communityDb.uniqueAlias.replace(/[^a-zA-Z0-9]/g, '_'),
      gmwBalance: new Balance(),
      aufBalance: new Balance(),
    })

    generateKeyPairCommunity(communityDb, context.cache, topicId)
    let creationDate = communityDb.creationDate
    if (communityDb.userMinCreatedAt && communityDb.userMinCreatedAt < communityDb.creationDate) {
      // create community root transaction 1 minute before first user
      creationDate = new Date(new Date(communityDb.userMinCreatedAt).getTime() - 1000 * 60)
    }
    // community from db to community format the dlt connector normally uses
    const community = communityDbToCommunity(topicId, communityDb, creationDate)
    // TODO: remove code for gmw and auf key somewhere else
    const communityKeyPair = await ResolveKeyPair(new KeyPairIdentifierLogic({ communityTopicId: topicId }))
    const gmwKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
    )
    if (!gmwKeyPair) {
      throw new GradidoBlockchainCryptoError(
        `KeyPairEd25519 child derivation failed, has private key: ${communityKeyPair.hasPrivateKey()} for community: ${communityDb.communityUuid}`,
      )
    }
    const aufKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
    )
    if (!aufKeyPair) {
      throw new GradidoBlockchainCryptoError(
        `KeyPairEd25519 child derivation failed, has private key: ${communityKeyPair.hasPrivateKey()} for community: ${communityDb.communityUuid}`,
      )
    }
    const accountBalances = new AccountBalances()
    accountBalances.add(new AccountBalance(gmwKeyPair.getPublicKey(), GradidoUnit.zero(), ''))
    accountBalances.add(new AccountBalance(aufKeyPair.getPublicKey(), GradidoUnit.zero(), ''))
    await addCommunityRootTransaction(blockchain, community, accountBalances)
  }
  return communities
}

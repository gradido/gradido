import { randomBytes } from 'node:crypto'
import { Abstract, AccountBalances, GradidoTransactionBuilder, InMemoryBlockchain, InMemoryBlockchainProvider, LedgerAnchor } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { CONFIG } from '../../config'
import { deriveFromSeed } from '../../data/deriveKeyPair'
import { Hex32, hex32Schema } from '../../schemas/typeGuard.schema'
import { AUF_ACCOUNT_DERIVATION_INDEX, GMW_ACCOUNT_DERIVATION_INDEX, hardenDerivationIndex } from '../../utils/derivationHelper'
import { addToBlockchain } from './blockchain'
import { Context } from './Context'
import { Balance } from './data/Balance'
import { loadAdminUsersCache, loadCommunities, loadContributionLinkModeratorCache } from './database'
import { CommunityContext } from './valibot.schema'

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
  const communityNames = new Set<string>()

  for (const communityDb of communitiesDb) {
    let alias = communityDb.name.toLowerCase()
    if (communityNames.has(alias)) {
      alias = communityDb.communityUuid
    } else {
      communityNames.add(alias)
    }
    const blockchain = InMemoryBlockchainProvider.getInstance().findBlockchain(alias)
    if (!blockchain) {
      throw new Error(`Couldn't create Blockchain for community ${alias}`)
    }
    context.logger.info(`Blockchain for community '${alias}' created`)
    let seed: Hex32
    if (!communityDb.foreign) {
      seed = v.parse(hex32Schema, CONFIG.HOME_COMMUNITY_SEED.convertToHex())
    } else {
      seed = v.parse(hex32Schema, randomBytes(32).toString('hex'))
    }
    
    let creationDate = communityDb.creationDate
    if (communityDb.userMinCreatedAt && communityDb.userMinCreatedAt < communityDb.creationDate) {
      // create community root transaction 1 minute before first user
      creationDate = new Date(new Date(communityDb.userMinCreatedAt).getTime() - 1000 * 60)
    }
    const communityKeyPair = deriveFromSeed(seed)
    const gmwKeyPair = communityKeyPair.deriveChild(hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX))
    const aufKeyPair = communityKeyPair.deriveChild(hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX))
    if (!communityKeyPair || !gmwKeyPair || !aufKeyPair) {
      throw new Error(`Error on creating key pair for community ${JSON.stringify(communityDb, null, 2)}`)
    }
    const builder = new GradidoTransactionBuilder()
    builder
      .setCreatedAt(creationDate)
      .setCommunityRoot(
        communityKeyPair.getPublicKey(),
        gmwKeyPair.getPublicKey(),
        aufKeyPair.getPublicKey(),
      )
      .setSenderCommunity(alias)
      .sign(communityKeyPair)

    const communityContext: CommunityContext = {
      communityId: alias,
      foreign: communityDb.foreign,
      blockchain,
      keyPair: communityKeyPair,
      folder: alias.replace(/[^a-z0-9]/g, '_'),
      gmwBalance: new Balance(gmwKeyPair.getPublicKey()!, alias),
      aufBalance: new Balance(aufKeyPair.getPublicKey()!, alias),
    }
    communities.set(communityDb.communityUuid, communityContext)
    const accountBalances = new AccountBalances()
    accountBalances.add(communityContext.aufBalance.getAccountBalance())
    accountBalances.add(communityContext.gmwBalance.getAccountBalance())
    addToBlockchain(
      builder.build(),
      blockchain,
      new LedgerAnchor(communityDb.id, LedgerAnchor.Type_LEGACY_GRADIDO_DB_COMMUNITY_ID),
      accountBalances,
    )
  }
  return communities
}

import { randomBytes } from 'node:crypto'
import {
  AccountBalances,
  GradidoTransactionBuilder,
  InMemoryBlockchainProvider,
  LedgerAnchor,
} from 'gradido-blockchain-js'
import * as v from 'valibot'
import { CONFIG } from '../../config'
import { deriveFromSeed } from '../../data/deriveKeyPair'
import { Hex32, hex32Schema } from '../../schemas/typeGuard.schema'
import {
  AUF_ACCOUNT_DERIVATION_INDEX,
  GMW_ACCOUNT_DERIVATION_INDEX,
  hardenDerivationIndex,
} from '../../utils/derivationHelper'
import { toFolderName } from '../../utils/filesystem'
import { addToBlockchain } from './blockchain'
import { Context } from './Context'
import { Balance } from './data/Balance'
import {
  loadAdminUsersCache,
  loadCommunities,
  loadContributionLinkModeratorCache,
} from './database'
import { CommunityContext } from './valibot.schema'

export async function bootstrap(): Promise<Context> {
  const context = await Context.create()
  context.communities = await bootstrapCommunities(context)
  await Promise.all([
    loadContributionLinkModeratorCache(context.db),
    loadAdminUsersCache(context.db),
  ])
  return context
}

async function bootstrapCommunities(context: Context): Promise<Map<string, CommunityContext>> {
  const communities = new Map<string, CommunityContext>()
  const communitiesDb = await loadCommunities(context.db)

  for (const communityDb of communitiesDb) {
    const communityId = communityDb.communityUuid
    const blockchain = InMemoryBlockchainProvider.getInstance().getBlockchain(communityId)
    if (!blockchain) {
      throw new Error(`Couldn't create Blockchain for community ${communityId}`)
    }
    context.logger.info(`Blockchain for community '${communityId}' created`)
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
    const gmwKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
    )
    const aufKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
    )
    if (!communityKeyPair || !gmwKeyPair || !aufKeyPair) {
      throw new Error(
        `Error on creating key pair for community ${JSON.stringify(communityDb, null, 2)}`,
      )
    }
    const builder = new GradidoTransactionBuilder()
    builder
      .setCreatedAt(creationDate)
      .setSenderCommunity(communityId)
      .setCommunityRoot(
        communityKeyPair.getPublicKey(),
        gmwKeyPair.getPublicKey(),
        aufKeyPair.getPublicKey(),
      )
      .sign(communityKeyPair)

    const communityContext: CommunityContext = {
      communityId,
      foreign: communityDb.foreign,
      blockchain,
      keyPair: communityKeyPair,
      folder: toFolderName(communityId),
      gmwBalance: new Balance(gmwKeyPair.getPublicKey()!, communityId),
      aufBalance: new Balance(aufKeyPair.getPublicKey()!, communityId),
    }
    communities.set(communityId, communityContext)
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

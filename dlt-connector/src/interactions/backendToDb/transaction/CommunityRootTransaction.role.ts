import { Community } from '@entity/Community'
// eslint-disable-next-line camelcase
import { MemoryBlock, GradidoTransactionBuilder } from 'gradido-blockchain-js'

import { KeyPair } from '@/data/KeyPair'
// import { TransactionBodyBuilder } from '@/data/proto/TransactionBody.builder'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'

import { AbstractTransactionRecipeRole } from './AbstractTransactionRecipeRole'

export class CommunityRootTransactionRole extends AbstractTransactionRecipeRole {
  public create(
    communityDraft: CommunityDraft,
    community: Community,
  ): AbstractTransactionRecipeRole {
    if (
      !community.rootPubkey ||
      !community.gmwAccount?.derive2Pubkey ||
      !community.aufAccount?.derive2Pubkey
    ) {
      throw new Error('missing one of the public keys for community')
    }
    // create proto transaction body
    const transaction = new GradidoTransactionBuilder()
      .setCommunityRoot(
        new MemoryBlock(community.rootPubkey),
        new MemoryBlock(community.gmwAccount?.derive2Pubkey),
        new MemoryBlock(community.aufAccount?.derive2Pubkey),
      )
      .setCreatedAt(new Date(communityDraft.createdAt))
      .sign(new KeyPair(community).keyPair)
      .build()

    // build transaction entity
    this.transactionBuilder.fromGradidoTransaction(transaction).setCommunity(community)
    return this
  }
}

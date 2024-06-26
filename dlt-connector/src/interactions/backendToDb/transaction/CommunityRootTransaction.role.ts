import { Community } from '@entity/Community'

import { KeyPair } from '@/data/KeyPair'
import { TransactionBodyBuilder } from '@/data/proto/TransactionBody.builder'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'

import { TransactionRecipeRole } from './TransactionRecipe.role'

export class CommunityRootTransactionRole extends TransactionRecipeRole {
  public createFromCommunityRoot(
    communityDraft: CommunityDraft,
    community: Community,
  ): CommunityRootTransactionRole {
    // create proto transaction body
    const transactionBody = new TransactionBodyBuilder()
      .fromCommunityDraft(communityDraft, community)
      .build()
    // build transaction entity
    this.transactionBuilder.fromTransactionBody(transactionBody).setCommunity(community)
    const transaction = this.transactionBuilder.getTransaction()
    // sign
    this.transactionBuilder.setSignature(new KeyPair(community).sign(transaction.bodyBytes))
    return this
  }
}

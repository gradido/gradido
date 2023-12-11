import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionRecipeRole } from './TransactionRecipe.role'
import { Community } from '@entity/Community'
import { TransactionBodyBuilder } from '@/data/proto/TransactionBody.builder'
import { KeyPair } from '@/data/KeyPair'
import { sign } from '@/utils/cryptoHelper'

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
    this.transactionBuilder.setSignature(sign(transaction.bodyBytes, new KeyPair(community)))
    return this
  }
}

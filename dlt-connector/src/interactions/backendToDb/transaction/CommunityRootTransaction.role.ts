import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionRecipeRole } from './TransactionRecipe.role'
import { Community } from '@entity/Community'
import { TransactionBodyBuilder } from '@/data/proto/TransactionBody.builder'
import { KeyPair } from '@/model/KeyPair'
import { sign } from '@/utils/cryptoHelper'

export class CommunityRootTransactionRole extends TransactionRecipeRole {
  public create(
    communityDraft: CommunityDraft,
    community: Community,
  ): CommunityRootTransactionRole {
    // create proto transaction body
    const transactionBody = new TransactionBodyBuilder().fromCommunityDraft(
      communityDraft,
      community,
    )
    // build transaction entity
    this.transactionBuilder.fromTransactionBody(transactionBody).setSenderCommunity(community)
    const transaction = this.transactionBuilder.getTransaction()
    // sign
    this.transactionBuilder.setSignature(sign(transaction.bodyBytes, new KeyPair(community)))
    return this
  }
}

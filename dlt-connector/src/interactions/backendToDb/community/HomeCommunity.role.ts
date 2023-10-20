import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'
import { CommunityRole } from './Community.role'
import { getTransaction } from '@/client/GradidoNode'
import { timestampSecondsToDate } from '@/utils/typeConverter'
import { createHomeCommunity } from '@/data/community.factory'
import { TransactionBodyBuilder } from '@/data/proto/TransactionBody.builder'
import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { KeyManager } from '@/controller/KeyManager'
import { KeyPair } from '@/model/KeyPair'
import { TransactionBuilder } from '@/data/Transaction.builder'

export class HomeCommunityRole extends CommunityRole {
  public async addCommunity(communityDraft: CommunityDraft, topic: string): Promise<Community> {
    const community = createHomeCommunity(communityDraft, topic)

    // check if a CommunityRoot Transaction exist already on iota blockchain
    const existingCommunityRootTransaction = await getTransaction(1, community.iotaTopic)
    if (existingCommunityRootTransaction) {
      community.confirmedAt = timestampSecondsToDate(existingCommunityRootTransaction.confirmedAt)
      return community.save()
    } else {
      // if not create transaction for it
      const transactionBody = new TransactionBodyBuilder().fromCommunityDraft(
        communityDraft,
        community,
      )
      const gradidoTransaction = new GradidoTransaction(transactionBody)
      KeyManager.getInstance().sign(gradidoTransaction, [new KeyPair(community)])
      const transactionBuilder = new TransactionBuilder()
      const transaction = transactionBuilder
        .fromGradidoTransaction(gradidoTransaction)
        .setSenderCommunity(community)
        .build()
    }
    return community.save()
  }
}

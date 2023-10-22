import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'
import { CommunityRole } from './Community.role'
import { getTransaction } from '@/client/GradidoNode'
import { timestampSecondsToDate } from '@/utils/typeConverter'
import { createHomeCommunity } from '@/data/community.factory'
import { createCommunityRootTransactionRecipe } from '../transaction/transaction.context'
import { QueryRunner } from 'typeorm'

export class HomeCommunityRole extends CommunityRole {
  public async addCommunity(communityDraft: CommunityDraft, topic: string): Promise<Community> {
    const community = createHomeCommunity(communityDraft, topic)

    // check if a CommunityRoot Transaction exist already on iota blockchain
    const existingCommunityRootTransaction = await getTransaction(1, community.iotaTopic)
    if (existingCommunityRootTransaction) {
      community.confirmedAt = timestampSecondsToDate(existingCommunityRootTransaction.confirmedAt)
      return community.save()
    } else {
      createCommunityRootTransactionRecipe(communityDraft, community).storeAsTransaction(
        async (queryRunner: QueryRunner): Promise<void> => {
          await queryRunner.manager.save(community)
        },
      )
    }
    return community.save()
  }
}

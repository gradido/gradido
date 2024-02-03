import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionError } from '@/graphql/model/TransactionError'
import { iotaTopicFromCommunityUUID } from '@/utils/typeConverter'

export abstract class AbstractTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(protected self: TransactionDraft) {}

  abstract getSigningUser(): UserIdentifier
  abstract getRecipientUser(): UserIdentifier
  abstract getCrossGroupType(): CrossGroupType

  public isCrossGroupTransaction(): boolean {
    return (
      this.self.user.communityUuid !== this.self.linkedUser.communityUuid &&
      this.self.linkedUser.communityUuid !== ''
    )
  }

  /**
   * otherGroup is the group/community on which this part of the transaction isn't stored
   * Alice from 'gdd1' Send 10 GDD to Bob in 'gdd2'
   * OUTBOUND came from sender, stored on sender community blockchain
   * OUTBOUND: stored on 'gdd1', otherGroup: 'gdd2'
   * INBOUND: goes to receiver, stored on receiver community blockchain
   * INBOUND: stored on 'gdd2', otherGroup: 'gdd1'
   * @returns iota topic
   */
  public getOtherGroup(): string {
    let user: UserIdentifier
    const type = this.getCrossGroupType()
    switch (type) {
      case CrossGroupType.LOCAL:
        return ''
      case CrossGroupType.INBOUND:
        user = this.getSigningUser()
        if (!user.communityUuid) {
          throw new TransactionError(
            TransactionErrorType.MISSING_PARAMETER,
            'missing sender/signing user community id for cross group transaction',
          )
        }
        return iotaTopicFromCommunityUUID(user.communityUuid)
      case CrossGroupType.OUTBOUND:
        user = this.getRecipientUser()
        if (!user.communityUuid) {
          throw new TransactionError(
            TransactionErrorType.MISSING_PARAMETER,
            'missing recipient user community id for cross group transaction',
          )
        }
        return iotaTopicFromCommunityUUID(user.communityUuid)
      default:
        throw new TransactionError(
          TransactionErrorType.NOT_IMPLEMENTED_YET,
          `type not implemented yet ${type}`,
        )
    }
  }
}

import { Community } from '@entity/Community'

import { CommunityRepository } from '@/data/Community.repository'
import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionError } from '@/graphql/model/TransactionError'
import { logger } from '@/logging/logger'
import { UserIdentifierLoggingView } from '@/logging/UserIdentifierLogging.view'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CreationTransactionRole extends AbstractTransactionRole {
  public getSigningUser(): UserIdentifier {
    return this.self.linkedUser
  }

  public getRecipientUser(): UserIdentifier {
    return this.self.user
  }

  public getCrossGroupType(): CrossGroupType {
    return CrossGroupType.LOCAL
  }

  public async getCommunity(): Promise<Community> {
    if (this.self.user.communityUuid !== this.self.linkedUser.communityUuid) {
      throw new TransactionError(
        TransactionErrorType.LOGIC_ERROR,
        'mismatch community uuids on creation transaction',
      )
    }
    const community = await CommunityRepository.getCommunityForUserIdentifier(this.self.user)
    if (!community) {
      logger.error(
        'missing community for user identifier',
        new UserIdentifierLoggingView(this.self.user),
      )
      throw new TransactionError(TransactionErrorType.NOT_FOUND, "couldn't find community for user")
    }
    return community
  }

  public async getOtherCommunity(): Promise<Community | null> {
    return null
  }
}

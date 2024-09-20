/* eslint-disable camelcase */
import { Community } from '@entity/Community'
import { MemoryBlock, GradidoTransactionBuilder, TransferAmount } from 'gradido-blockchain-js'

import { CommunityRepository } from '@/data/Community.repository'
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

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const recipientUser = await this.loadUser(this.self.user)
    if (!this.self.targetDate) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'missing targetDate for contribution',
      )
    }
    return builder
      .setTransactionCreation(
        new TransferAmount(
          new MemoryBlock(recipientUser.derive2Pubkey),
          this.self.amount.toString(),
        ),
        new Date(this.self.targetDate),
      )
      .setMemo('dummy memo for creation')
  }

  public async getCommunity(): Promise<Community> {
    if (this.self.user.communityUuid !== this.self.linkedUser.communityUuid) {
      throw new TransactionError(
        TransactionErrorType.LOGIC_ERROR,
        'mismatch community uuids on contribution',
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

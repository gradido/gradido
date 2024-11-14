import { GradidoTransactionBuilder, GradidoTransfer, TransferAmount } from 'gradido-blockchain-js'

import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class DeferredTransferTransactionRole extends AbstractTransactionRole {
  constructor(protected self: TransactionDraft) {
    super()
  }

  getSenderCommunityUuid(): string {
    return this.self.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    throw new TransactionError(
      TransactionErrorType.LOGIC_ERROR,
      'deferred transfer: cannot be used as cross group transaction',
    )
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    if (!this.self.linkedUser || !this.self.linkedUser.seed) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'deferred transfer: missing linked user or not a seed',
      )
    }
    if (!this.self.amount) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'deferred transfer: amount missing',
      )
    }
    if (!this.self.timeoutDate) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'deferred transfer: timeout date missing',
      )
    }
    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await KeyPairCalculation(this.self.user)
    const recipientKeyPair = await KeyPairCalculation(this.self.linkedUser)

    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .setMemo('dummy memo for transfer')
      .setDeferredTransfer(
        new GradidoTransfer(
          new TransferAmount(senderKeyPair.getPublicKey(), this.self.amount.toString()),
          recipientKeyPair.getPublicKey(),
        ),
        new Date(this.self.timeoutDate),
      )
    builder.sign(senderKeyPair)
    return builder
  }
}

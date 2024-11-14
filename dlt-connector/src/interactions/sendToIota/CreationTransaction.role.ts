import { GradidoTransactionBuilder, TransferAmount } from 'gradido-blockchain-js'

import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CreationTransactionRole extends AbstractTransactionRole {
  constructor(private self: TransactionDraft) {
    super()
  }

  getSenderCommunityUuid(): string {
    return this.self.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    throw new TransactionError(
      TransactionErrorType.LOGIC_ERROR,
      'creation: cannot be used as cross group transaction',
    )
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    if (!this.self.targetDate) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'creation: target date missing',
      )
    }
    if (!this.self.linkedUser) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'creation: linked user missing',
      )
    }
    if (!this.self.amount) {
      throw new TransactionError(TransactionErrorType.MISSING_PARAMETER, 'creation: amount missing')
    }
    const builder = new GradidoTransactionBuilder()
    const recipientKeyPair = await KeyPairCalculation(this.self.user)
    const signerKeyPair = await KeyPairCalculation(this.self.linkedUser)

    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .setMemo('dummy memo for creation')
      .setTransactionCreation(
        new TransferAmount(recipientKeyPair.getPublicKey(), this.self.amount.toString()),
        new Date(this.self.targetDate),
      )
      .sign(signerKeyPair)
    return builder
  }
}

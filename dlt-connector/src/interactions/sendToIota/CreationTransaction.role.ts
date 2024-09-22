import { GradidoTransactionBuilder, TransferAmount } from 'gradido-blockchain-js'

import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { LogError } from '@/server/LogError'

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
    throw new LogError('cannot be used as cross group transaction')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const recipientKeyPair = await KeyPairCalculation(this.self.user)
    const signerKeyPair = await KeyPairCalculation(this.self.linkedUser)
    if (!this.self.targetDate) {
      throw new LogError('target date missing for creation transaction')
    }
    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .setTransactionCreation(
        new TransferAmount(recipientKeyPair.getPublicKey(), this.self.amount.toString()),
        new Date(this.self.targetDate),
      )
      .sign(signerKeyPair)
    return builder
  }
}

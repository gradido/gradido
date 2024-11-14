import { GradidoTransactionBuilder, GradidoTransfer, TransferAmount } from 'gradido-blockchain-js'

import { IdentifierSeed } from '@/graphql/input/IdentifierSeed'
import { TransactionLinkDraft } from '@/graphql/input/TransactionLinkDraft'
import { LogError } from '@/server/LogError'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class DeferredTransferTransactionRole extends AbstractTransactionRole {
  constructor(protected self: TransactionLinkDraft) {
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
    const senderKeyPair = await KeyPairCalculation(this.self.user)
    const recipientKeyPair = await KeyPairCalculation(new IdentifierSeed(this.self.seed))

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

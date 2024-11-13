import { GradidoTransactionBuilder, GradidoTransfer, TransferAmount } from 'gradido-blockchain-js'

import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { LogError } from '@/server/LogError'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { TransferTransactionRole } from './TransferTransaction.role'

export class DeferredTransferTransactionRole extends TransferTransactionRole {
  getRecipientCommunityUuid(): string {
    throw new LogError('cannot be used as cross group transaction')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    if (this.self.linkedUser instanceof UserIdentifier) {
      throw new LogError('invalid recipient, it is a UserIdentifier instead of a IdentifierSeed')
    }
    if (!this.self.timeoutDate) {
      throw new LogError('timeoutDate date missing for deferred transfer transaction')
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

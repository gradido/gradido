import { GradidoTransactionBuilder, GradidoTransfer, TransferAmount } from 'gradido-blockchain-js'

import { LogError } from '@/server/LogError'
import { uuid4ToHash } from '@/utils/typeConverter'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { TransferTransactionRole } from './TransferTransaction.role'

export class DeferredTransferTransactionRole extends TransferTransactionRole {
  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await KeyPairCalculation(this.self.user)
    const recipientKeyPair = await KeyPairCalculation(this.self.linkedUser)
    if (!this.self.timeoutDate) {
      throw new LogError('timeoutDate date missing for deferred transfer transaction')
    }
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
    const senderCommunity = this.self.user.communityUuid
    const recipientCommunity = this.self.linkedUser.communityUuid
    if (senderCommunity !== recipientCommunity) {
      // we have a cross group transaction
      builder
        .setSenderCommunity(uuid4ToHash(senderCommunity).convertToHex())
        .setRecipientCommunity(uuid4ToHash(recipientCommunity).convertToHex())
    }
    builder.sign(senderKeyPair)
    return builder
  }
}

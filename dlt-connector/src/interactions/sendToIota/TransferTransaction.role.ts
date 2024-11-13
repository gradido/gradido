import { GradidoTransactionBuilder, TransferAmount } from 'gradido-blockchain-js'

import { IdentifierSeed } from '@/graphql/input/IdentifierSeed'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { LogError } from '@/server/LogError'
import { uuid4ToHash } from '@/utils/typeConverter'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class TransferTransactionRole extends AbstractTransactionRole {
  constructor(protected self: TransactionDraft) {
    super()
  }

  getSenderCommunityUuid(): string {
    return this.self.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    if (this.self.linkedUser instanceof IdentifierSeed) {
      throw new LogError('invalid recipient, it is a IdentifierSeed instead of a UserIdentifier')
    }
    return this.self.linkedUser.communityUuid
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    if (this.self.linkedUser instanceof IdentifierSeed) {
      throw new LogError('invalid recipient, it is a IdentifierSeed instead of a UserIdentifier')
    }

    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await KeyPairCalculation(this.self.user)
    const recipientKeyPair = await KeyPairCalculation(this.self.linkedUser)
    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .setMemo('dummy memo for transfer')
      .setTransactionTransfer(
        new TransferAmount(senderKeyPair.getPublicKey(), this.self.amount.toString()),
        recipientKeyPair.getPublicKey(),
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

import { GradidoTransactionBuilder, TransferAmount } from 'gradido-blockchain-js'

import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionError } from '@/graphql/model/TransactionError'
import { uuid4ToHash } from '@/utils/typeConverter'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class TransferTransactionRole extends AbstractTransactionRole {
  private linkedUser: UserIdentifier
  constructor(private self: TransactionDraft) {
    super()
    if (!this.self.linkedUser) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'transfer: linked user missing',
      )
    }
    this.linkedUser = this.self.linkedUser
  }

  getSenderCommunityUuid(): string {
    return this.self.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    return this.linkedUser.communityUuid
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    if (!this.self.amount) {
      throw new TransactionError(TransactionErrorType.MISSING_PARAMETER, 'transfer: amount missing')
    }
    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await KeyPairCalculation(this.self.user)
    const recipientKeyPair = await KeyPairCalculation(this.linkedUser)
    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .setMemo('dummy memo for transfer')
      .setTransactionTransfer(
        new TransferAmount(senderKeyPair.getPublicKey(), this.self.amount.toString()),
        recipientKeyPair.getPublicKey(),
      )
    const senderCommunity = this.self.user.communityUuid
    const recipientCommunity = this.linkedUser.communityUuid
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

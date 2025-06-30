import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  GradidoUnit,
  TransferAmount,
} from 'gradido-blockchain-js'

import { KeyPairIdentifier } from '@/data/KeyPairIdentifier'
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
    if (!this.self.memo) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'deferred transfer: memo missing',
      )
    }
    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await KeyPairCalculation(new KeyPairIdentifier(this.self.user))
    const recipientKeyPair = await KeyPairCalculation(new KeyPairIdentifier(this.linkedUser))

    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .addMemo(
        new EncryptedMemo(
          this.self.memo,
          new AuthenticatedEncryption(senderKeyPair),
          new AuthenticatedEncryption(recipientKeyPair),
        ),
      )
      .setTransactionTransfer(
        new TransferAmount(senderKeyPair.getPublicKey(), GradidoUnit.fromString(this.self.amount)),
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

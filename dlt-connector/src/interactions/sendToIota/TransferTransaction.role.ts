import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  TransferAmount,
} from 'gradido-blockchain-js'

import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'
import { TransferTransactionInput, transferTransactionSchema, TransferTransaction } from '../../schemas/transaction.schema'
import * as v from 'valibot'
import { uuid4ToTopicSchema } from '../../schemas/typeConverter.schema'

export class TransferTransactionRole extends AbstractTransactionRole {
  private tx: TransferTransaction
  constructor(input: TransferTransactionInput) {
    super()
    this.tx = v.parse(transferTransactionSchema, input)
  }

  getSenderCommunityUuid(): string {
    return this.tx.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    return this.tx.linkedUser.communityUuid
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    // sender + signer
    const senderKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(this.tx.user)
    )
    // recipient
    const recipientKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(this.tx.linkedUser)
    )

    builder
      .setCreatedAt(new Date(this.tx.createdAt))
      .addMemo(
        new EncryptedMemo(
          this.tx.memo,
          new AuthenticatedEncryption(senderKeyPair),
          new AuthenticatedEncryption(recipientKeyPair),
        ),
      )
      .setTransactionTransfer(
        new TransferAmount(senderKeyPair.getPublicKey(), this.tx.amount),
        recipientKeyPair.getPublicKey(),
      )
    const senderCommunity = this.tx.user.communityUuid
    const recipientCommunity = this.tx.linkedUser.communityUuid
    if (senderCommunity !== recipientCommunity) {
      // we have a cross group transaction
      builder
        .setSenderCommunity(v.parse(uuid4ToTopicSchema, senderCommunity))
        .setRecipientCommunity(v.parse(uuid4ToTopicSchema, recipientCommunity))
    }
    builder.sign(senderKeyPair)
    return builder
  }
}

import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  TransferAmount,
} from 'gradido-blockchain-js'
import { parse } from 'valibot'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import {
  TransferTransaction,
  transferTransactionSchema,
  Transaction,
} from '../../schemas/transaction.schema'
import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'
import { HieroId } from '../../schemas/typeGuard.schema'

export class TransferTransactionRole extends AbstractTransactionRole {
  private transferTransaction: TransferTransaction
  constructor(input: Transaction) {
    super()
    this.transferTransaction = parse(transferTransactionSchema, input)
  }

  getSenderCommunityTopicId(): HieroId {
    return this.transferTransaction.user.communityTopicId
  }

  getRecipientCommunityTopicId(): HieroId {
    return this.transferTransaction.linkedUser.communityTopicId
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    // sender + signer
    const senderKeyPair = await KeyPairCalculation(new KeyPairIdentifierLogic(this.transferTransaction.user))
    // recipient
    const recipientKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(this.transferTransaction.linkedUser),
    )

    builder
      .setCreatedAt(this.transferTransaction.createdAt)
      .addMemo(
        new EncryptedMemo(
          this.transferTransaction.memo,
          new AuthenticatedEncryption(senderKeyPair),
          new AuthenticatedEncryption(recipientKeyPair),
        ),
      )
      .setTransactionTransfer(
        new TransferAmount(senderKeyPair.getPublicKey(), this.transferTransaction.amount),
        recipientKeyPair.getPublicKey(),
      )
    const senderCommunity = this.transferTransaction.user.communityTopicId
    const recipientCommunity = this.transferTransaction.linkedUser.communityTopicId
    if (senderCommunity !== recipientCommunity) {
      // we have a cross group transaction
      builder
        .setSenderCommunity(senderCommunity)
        .setRecipientCommunity(recipientCommunity)
    }
    builder.sign(senderKeyPair)
    return builder
  }
}

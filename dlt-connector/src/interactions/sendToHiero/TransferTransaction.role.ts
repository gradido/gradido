import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  TransferAmount,
} from 'gradido-blockchain-js'
import * as v from 'valibot'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import {
  Transaction,
  TransferTransaction,
  transferTransactionSchema,
} from '../../schemas/transaction.schema'
import { HieroId } from '../../schemas/typeGuard.schema'
import { ResolveKeyPair } from '../resolveKeyPair/ResolveKeyPair.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'

export class TransferTransactionRole extends AbstractTransactionRole {
  private transferTransaction: TransferTransaction
  constructor(input: Transaction) {
    super()
    this.transferTransaction = v.parse(transferTransactionSchema, input)
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
    const senderKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic(this.transferTransaction.user),
    )
    // recipient
    const recipientKeyPair = await ResolveKeyPair(
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
      .setSenderCommunity(this.transferTransaction.user.communityId)
      .setRecipientCommunity(this.transferTransaction.linkedUser.communityId)
      .setTransactionTransfer(
        new TransferAmount(
          senderKeyPair.getPublicKey(),
          this.transferTransaction.amount,
          this.transferTransaction.user.communityId,
        ),
        recipientKeyPair.getPublicKey(),
      )
    builder.sign(senderKeyPair)
    return builder
  }
}

import { GradidoTransactionBuilder, GradidoTransfer, TransferAmount } from 'gradido-blockchain-js'
import { parse } from 'valibot'
import { GradidoNodeClient } from '../../client/GradidoNode/GradidoNodeClient'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import {
  RedeemDeferredTransferTransaction,
  redeemDeferredTransferTransactionSchema,
  Transaction,
  UserAccount,
} from '../../schemas/transaction.schema'
import { HieroId } from '../../schemas/typeGuard.schema'
import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'

export class RedeemDeferredTransferTransactionRole extends AbstractTransactionRole {
  private linkedUser: UserAccount
  private readonly redeemDeferredTransferTransaction: RedeemDeferredTransferTransaction
  constructor(transaction: Transaction) {
    super()
    this.redeemDeferredTransferTransaction = parse(
      redeemDeferredTransferTransactionSchema,
      transaction,
    )
    this.linkedUser = this.redeemDeferredTransferTransaction.linkedUser
  }

  getSenderCommunityTopicId(): HieroId {
    return this.redeemDeferredTransferTransaction.user.communityTopicId
  }

  getRecipientCommunityTopicId(): HieroId {
    return this.linkedUser.communityTopicId
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(this.redeemDeferredTransferTransaction.user),
    )
    const senderPublicKey = senderKeyPair.getPublicKey()
    if (!senderPublicKey) {
      throw new Error("redeem deferred transfer: couldn't calculate sender public key")
    }
    // load deferred transfer transaction from gradido node
    const transactions = await GradidoNodeClient.getInstance().getTransactionsForAccount(
      { maxResultCount: 2, topic: this.getSenderCommunityTopicId() },
      senderPublicKey.convertToHex(),
    )
    if (!transactions || transactions.length !== 1) {
      throw new Error("redeem deferred transfer: couldn't find deferred transfer on Gradido Node")
    }
    const deferredTransfer = transactions[0]
    const deferredTransferBody = deferredTransfer.getGradidoTransaction()?.getTransactionBody()
    if (!deferredTransferBody) {
      throw new Error(
        "redeem deferred transfer: couldn't deserialize deferred transfer from Gradido Node",
      )
    }
    const recipientKeyPair = await KeyPairCalculation(new KeyPairIdentifierLogic(this.linkedUser))

    builder
      .setCreatedAt(this.redeemDeferredTransferTransaction.createdAt)
      .setRedeemDeferredTransfer(
        deferredTransfer.getId(),
        new GradidoTransfer(
          new TransferAmount(
            senderKeyPair.getPublicKey(),
            this.redeemDeferredTransferTransaction.amount,
          ),
          recipientKeyPair.getPublicKey(),
        ),
      )
    const memos = deferredTransferBody.getMemos()
    for (let i = 0; i < memos.size(); i++) {
      builder.addMemo(memos.get(i))
    }
    const senderCommunity = this.redeemDeferredTransferTransaction.user.communityTopicId
    const recipientCommunity = this.linkedUser.communityTopicId
    if (senderCommunity !== recipientCommunity) {
      // we have a cross group transaction
      builder.setSenderCommunity(senderCommunity).setRecipientCommunity(recipientCommunity)
    }
    builder.sign(senderKeyPair)
    return builder
  }
}

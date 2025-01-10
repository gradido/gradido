import {
  GradidoTransactionBuilder,
  GradidoTransfer,
  GradidoUnit,
  TransferAmount,
} from 'gradido-blockchain-js'

import { getTransactionsForAccount } from '@/client/GradidoNode'
import { KeyPairIdentifier } from '@/data/KeyPairIdentifier'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionError } from '@/graphql/model/TransactionError'
import { communityUuidToTopic, uuid4ToHash } from '@/utils/typeConverter'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class RedeemDeferredTransferTransactionRole extends AbstractTransactionRole {
  private linkedUser: UserIdentifier
  constructor(protected self: TransactionDraft) {
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
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'redeem deferred transfer: amount missing',
      )
    }
    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await KeyPairCalculation(new KeyPairIdentifier(this.self.user))
    const senderPublicKey = senderKeyPair.getPublicKey()
    if (!senderPublicKey) {
      throw new TransactionError(
        TransactionErrorType.INVALID_PARAMETER,
        "redeem deferred transfer: couldn't calculate sender public key",
      )
    }
    // load deferred transfer transaction from gradido node
    const transactions = await getTransactionsForAccount(
      senderPublicKey,
      communityUuidToTopic(this.getSenderCommunityUuid()),
    )
    if (!transactions || transactions.length !== 1) {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "redeem deferred transfer: couldn't find deferred transfer on Gradido Node",
      )
    }
    const deferredTransfer = transactions[0]
    const deferredTransferBody = deferredTransfer.getGradidoTransaction()?.getTransactionBody()
    if (!deferredTransferBody) {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "redeem deferred transfer: couldn't deserialize deferred transfer from Gradido Node",
      )
    }
    const recipientKeyPair = await KeyPairCalculation(new KeyPairIdentifier(this.linkedUser))

    // TODO: fix getMemos in gradido-blockchain-js to return correct data
    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .addMemo(deferredTransferBody.getMemos()[0])
      .setRedeemDeferredTransfer(
        deferredTransfer.getId(),
        new GradidoTransfer(
          new TransferAmount(
            senderKeyPair.getPublicKey(),
            GradidoUnit.fromString(this.self.amount),
          ),
          recipientKeyPair.getPublicKey(),
        ),
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

import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  GradidoTransfer,
  TransferAmount,
} from 'gradido-blockchain-js'
import * as v from 'valibot'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import {
  DeferredTransferTransaction,
  deferredTransferTransactionSchema,
  Transaction,
} from '../../schemas/transaction.schema'
import { HieroId, IdentifierSeed, identifierSeedSchema } from '../../schemas/typeGuard.schema'
import { ResolveKeyPair } from '../resolveKeyPair/ResolveKeyPair.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'

export class DeferredTransferTransactionRole extends AbstractTransactionRole {
  private readonly seed: IdentifierSeed
  private readonly deferredTransferTransaction: DeferredTransferTransaction
  constructor(transaction: Transaction) {
    super()
    this.deferredTransferTransaction = v.parse(deferredTransferTransactionSchema, transaction)
    this.seed = v.parse(identifierSeedSchema, this.deferredTransferTransaction.linkedUser.seed)
  }

  getSenderCommunityTopicId(): HieroId {
    return this.deferredTransferTransaction.user.communityTopicId
  }

  getRecipientCommunityTopicId(): HieroId {
    throw new Error('deferred transfer: cannot be used as cross group transaction yet')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic(this.deferredTransferTransaction.user),
    )
    const recipientKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic({
        communityTopicId: this.deferredTransferTransaction.linkedUser.communityTopicId,
        communityId: this.deferredTransferTransaction.linkedUser.communityId,
        seed: this.seed,
      }),
    )

    builder
      .setCreatedAt(this.deferredTransferTransaction.createdAt)
      .addMemo(
        new EncryptedMemo(
          this.deferredTransferTransaction.memo,
          new AuthenticatedEncryption(senderKeyPair),
          new AuthenticatedEncryption(recipientKeyPair),
        ),
      )
      .setSenderCommunity(this.deferredTransferTransaction.user.communityId)
      .setDeferredTransfer(
        new GradidoTransfer(
          new TransferAmount(
            senderKeyPair.getPublicKey(),
            this.deferredTransferTransaction.amount.calculateCompoundInterest(
              this.deferredTransferTransaction.timeoutDuration.getSeconds(),
            ),
            this.deferredTransferTransaction.user.communityId,
          ),
          recipientKeyPair.getPublicKey(),
        ),
        this.deferredTransferTransaction.timeoutDuration,
      )
      .sign(senderKeyPair)
    return builder
  }
}

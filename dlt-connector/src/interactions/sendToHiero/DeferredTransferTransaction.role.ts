import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  GradidoTransfer,
  TransferAmount,
} from 'gradido-blockchain-js'
import { parse } from 'valibot'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { IdentifierSeed, identifierSeedSchema } from '../../schemas/account.schema'
import {
  DeferredTransferTransaction,
  deferredTransferTransactionSchema,
  Transaction,
} from '../../schemas/transaction.schema'
import { HieroId } from '../../schemas/typeGuard.schema'
import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'

export class DeferredTransferTransactionRole extends AbstractTransactionRole {
  private readonly seed: IdentifierSeed
  private readonly deferredTransferTransaction: DeferredTransferTransaction
  constructor(transaction: Transaction) {
    super()
    this.deferredTransferTransaction = parse(deferredTransferTransactionSchema, transaction)
    this.seed = parse(identifierSeedSchema, this.deferredTransferTransaction.linkedUser.seed)
  }

  getSenderCommunityTopicId(): HieroId {
    return this.deferredTransferTransaction.user.communityTopicId
  }

  getRecipientCommunityTopicId(): HieroId {
    throw new Error('deferred transfer: cannot be used as cross group transaction yet')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(this.deferredTransferTransaction.user),
    )
    const recipientKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic({
        communityTopicId: this.deferredTransferTransaction.linkedUser.communityTopicId,
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
      .setDeferredTransfer(
        new GradidoTransfer(
          new TransferAmount(
            senderKeyPair.getPublicKey(),
            this.deferredTransferTransaction.amount.calculateCompoundInterest(
              this.deferredTransferTransaction.timeoutDuration.getSeconds(),
            ),
          ),
          recipientKeyPair.getPublicKey(),
        ),
        this.deferredTransferTransaction.timeoutDuration,
      )
      .sign(senderKeyPair)
    return builder
  }
}

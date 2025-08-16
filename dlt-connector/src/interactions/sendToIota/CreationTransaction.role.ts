import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  TransferAmount,
} from 'gradido-blockchain-js'
import { parse } from 'valibot'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { KeyPairCacheManager } from '../../KeyPairCacheManager'
import {
  CreationTransaction,
  creationTransactionSchema,
  Transaction,
} from '../../schemas/transaction.schema'
import { HieroId } from '../../schemas/typeGuard.schema'
import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CreationTransactionRole extends AbstractTransactionRole {
  private readonly homeCommunityTopicId: HieroId
  private readonly creationTransaction: CreationTransaction
  constructor(transaction: Transaction) {
    super()
    this.creationTransaction = parse(creationTransactionSchema, transaction)
    this.homeCommunityTopicId = KeyPairCacheManager.getInstance().getHomeCommunityTopicId()
    if (
      this.homeCommunityTopicId !== this.creationTransaction.user.communityTopicId ||
      this.homeCommunityTopicId !== this.creationTransaction.linkedUser.communityTopicId
    ) {
      throw new Error('creation: both recipient and signer must belong to home community')
    }
  }

  getSenderCommunityTopicId(): HieroId {
    return this.creationTransaction.user.communityTopicId
  }

  getRecipientCommunityTopicId(): HieroId {
    throw new Error('creation: cannot be used as cross group transaction')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    // Recipient: user (account owner)
    const recipientKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(this.creationTransaction.user),
    )
    // Signer: linkedUser (admin/moderator)
    const signerKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(this.creationTransaction.linkedUser),
    )
    const homeCommunityKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic({
        communityTopicId: this.homeCommunityTopicId,
      }),
    )
    // Memo: encrypted, home community and recipient can decrypt it
    builder
      .setCreatedAt(this.creationTransaction.createdAt)
      .addMemo(
        new EncryptedMemo(
          this.creationTransaction.memo,
          new AuthenticatedEncryption(homeCommunityKeyPair),
          new AuthenticatedEncryption(recipientKeyPair),
        ),
      )
      .setTransactionCreation(
        new TransferAmount(recipientKeyPair.getPublicKey(), this.creationTransaction.amount),
        this.creationTransaction.targetDate,
      )
      .sign(signerKeyPair)
    return builder
  }
}

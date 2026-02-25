import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  TransferAmount,
} from 'gradido-blockchain-js'
import { parse } from 'valibot'
import { KeyPairCacheManager } from '../../cache/KeyPairCacheManager'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import {
  CreationTransaction,
  creationTransactionSchema,
  Transaction,
} from '../../schemas/transaction.schema'
import { HieroId } from '../../schemas/typeGuard.schema'
import { ResolveKeyPair } from '../resolveKeyPair/ResolveKeyPair.context'
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
    return this.creationTransaction.user.communityTopicId
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    // Recipient: user (account owner)
    const recipientKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic(this.creationTransaction.user),
    )
    // Signer: linkedUser (admin/moderator)
    const signerKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic(this.creationTransaction.linkedUser),
    )
    const homeCommunityKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic({
        communityTopicId: this.homeCommunityTopicId,
        communityId: this.creationTransaction.user.communityId,
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
        new TransferAmount(
          recipientKeyPair.getPublicKey(),
          this.creationTransaction.amount,
          this.creationTransaction.user.communityId,
        ),
        this.creationTransaction.targetDate,
      )
      .sign(signerKeyPair)
    return builder
  }
}

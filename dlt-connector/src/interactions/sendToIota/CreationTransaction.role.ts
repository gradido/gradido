import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  TransferAmount,
} from 'gradido-blockchain-js'

import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { CreationTransactionInput, creationTransactionSchema, CreationTransaction } from '../../schemas/transaction.schema'
import { KeyPairCacheManager } from '../../KeyPairCacheManager'
import { TRPCError } from '@trpc/server'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'
import * as v from 'valibot'
import { AbstractTransactionRole } from './AbstractTransaction.role'
import { Uuidv4, uuidv4Schema } from '../../schemas/typeConverter.schema'

export class CreationTransactionRole extends AbstractTransactionRole {
  private tx: CreationTransaction
  private homeCommunityUuid: Uuidv4
  constructor(input: CreationTransactionInput) {
    super()
    this.tx = v.parse(creationTransactionSchema, input)
    this.homeCommunityUuid = v.parse(
      uuidv4Schema, 
      KeyPairCacheManager.getInstance().getHomeCommunityUUID()
    )
    if (
      this.homeCommunityUuid !== this.tx.user.communityUuid ||
      this.homeCommunityUuid !== this.tx.linkedUser.communityUuid
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'creation: both recipient and signer must belong to home community',
      })
    }
  }

  getSenderCommunityUuid(): string {
    return this.tx.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'creation: cannot be used as cross group transaction',
    })
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    // Recipient: user (account owner)
    const recipientKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(this.tx.user)
    )
    // Signer: linkedUser (admin/moderator)
    const signerKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(this.tx.linkedUser)
    )
    const homeCommunityKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic({ 
        communityUuid: this.homeCommunityUuid 
      }),
    )
    // Memo: encrypted, home community and recipient can decrypt it
    builder
      .setCreatedAt(this.tx.createdAt)
      .addMemo(new EncryptedMemo(
        this.tx.memo,
        new AuthenticatedEncryption(homeCommunityKeyPair),
        new AuthenticatedEncryption(recipientKeyPair),
      ))
      .setTransactionCreation(
        new TransferAmount(
          recipientKeyPair.getPublicKey(),
          this.tx.amount,
        ),
        this.tx.targetDate,
      )
      .sign(signerKeyPair)
    return builder
  }
}

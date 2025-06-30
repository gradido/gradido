import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  GradidoUnit,
  TransferAmount,
} from 'gradido-blockchain-js'

import { KeyPairIdentifier } from '@/data/KeyPairIdentifier'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { KeyPairCacheManager } from '@/manager/KeyPairCacheManager'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CreationTransactionRole extends AbstractTransactionRole {
  constructor(private self: TransactionDraft) {
    super()
  }

  getSenderCommunityUuid(): string {
    return this.self.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    throw new TransactionError(
      TransactionErrorType.LOGIC_ERROR,
      'creation: cannot be used as cross group transaction',
    )
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    if (!this.self.targetDate) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'creation: target date missing',
      )
    }
    if (!this.self.linkedUser) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'creation: linked user missing',
      )
    }
    if (!this.self.amount) {
      throw new TransactionError(TransactionErrorType.MISSING_PARAMETER, 'creation: amount missing')
    }
    if (!this.self.memo) {
      throw new TransactionError(TransactionErrorType.MISSING_PARAMETER, 'creation: memo missing')
    }

    const builder = new GradidoTransactionBuilder()
    const recipientKeyPair = await KeyPairCalculation(new KeyPairIdentifier(this.self.user))
    const signerKeyPair = await KeyPairCalculation(new KeyPairIdentifier(this.self.linkedUser))
    const homeCommunityKeyPair = await KeyPairCalculation(
      new KeyPairIdentifier(KeyPairCacheManager.getInstance().getHomeCommunityUUID()),
    )

    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .addMemo(new EncryptedMemo(this.self.memo, new AuthenticatedEncryption(homeCommunityKeyPair)))
      .setTransactionCreation(
        new TransferAmount(
          recipientKeyPair.getPublicKey(),
          GradidoUnit.fromString(this.self.amount),
        ),
        new Date(this.self.targetDate),
      )
      .sign(signerKeyPair)
    return builder
  }
}

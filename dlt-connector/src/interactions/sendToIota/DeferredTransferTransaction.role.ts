import {
  AuthenticatedEncryption,
  DurationSeconds,
  EncryptedMemo,
  GradidoTransactionBuilder,
  GradidoTransfer,
  GradidoUnit,
  TransferAmount,
} from 'gradido-blockchain-js'

import { KeyPairIdentifier } from '@/data/KeyPairIdentifier'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class DeferredTransferTransactionRole extends AbstractTransactionRole {
  constructor(protected self: TransactionDraft) {
    super()
  }

  getSenderCommunityUuid(): string {
    return this.self.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    throw new TransactionError(
      TransactionErrorType.LOGIC_ERROR,
      'deferred transfer: cannot be used as cross group transaction',
    )
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    if (!this.self.linkedUser || !this.self.linkedUser.seed) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'deferred transfer: missing linked user or not a seed',
      )
    }
    if (!this.self.amount) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'deferred transfer: amount missing',
      )
    }
    if (!this.self.memo) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'deferred transfer: memo missing',
      )
    }
    if (!this.self.timeoutDuration) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'deferred transfer: timeout duration missing',
      )
    }
    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await KeyPairCalculation(new KeyPairIdentifier(this.self.user))
    const recipientKeyPair = await KeyPairCalculation(new KeyPairIdentifier(this.self.linkedUser))

    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .addMemo(
        new EncryptedMemo(
          this.self.memo,
          new AuthenticatedEncryption(senderKeyPair),
          new AuthenticatedEncryption(recipientKeyPair),
        ),
      )
      .setDeferredTransfer(
        new GradidoTransfer(
          new TransferAmount(
            senderKeyPair.getPublicKey(),
            GradidoUnit.fromString(this.self.amount).calculateCompoundInterest(
              this.self.timeoutDuration,
            ),
          ),
          recipientKeyPair.getPublicKey(),
        ),
        new DurationSeconds(this.self.timeoutDuration),
      )
      .sign(senderKeyPair)
    return builder
  }
}

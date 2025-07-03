import {
  AuthenticatedEncryption,
  EncryptedMemo,
  GradidoTransactionBuilder,
  GradidoTransfer,
  TransferAmount,
} from 'gradido-blockchain-js'

import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { DeferredTransferTransactionInput, deferredTransferTransactionSchema, DeferredTransferTransaction } from '../../schemas/transaction.schema'
import * as v from 'valibot'
import { TRPCError } from '@trpc/server'
import { identifierSeedSchema, IdentifierSeed } from '../../schemas/account.schema'

export class DeferredTransferTransactionRole extends AbstractTransactionRole {
  private tx: DeferredTransferTransaction
  private seed: IdentifierSeed
  constructor(protected input: DeferredTransferTransactionInput) {
    super()
    this.tx = v.parse(deferredTransferTransactionSchema, input)
    this.seed = v.parse(identifierSeedSchema, input.linkedUser.seed)
  }

  getSenderCommunityUuid(): string {
    return this.tx.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'deferred transfer: cannot be used as cross group transaction yet',
    })
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const senderKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic(this.tx.user)
    )
    const recipientKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic({ 
        communityUuid: this.tx.linkedUser.communityUuid,
        seed: this.seed,
      })
    )

    builder
      .setCreatedAt(this.tx.createdAt)
      .addMemo(
        new EncryptedMemo(
          this.tx.memo,
          new AuthenticatedEncryption(senderKeyPair),
          new AuthenticatedEncryption(recipientKeyPair),
        ),
      )
      .setDeferredTransfer(
        new GradidoTransfer(
          new TransferAmount(
            senderKeyPair.getPublicKey(),
            this.tx.amount.calculateCompoundInterest(
              this.tx.timeoutDuration.getSeconds(),
            ),
          ),
          recipientKeyPair.getPublicKey(),
        ),
        this.tx.timeoutDuration,
      )
      .sign(senderKeyPair)
    return builder
  }
}

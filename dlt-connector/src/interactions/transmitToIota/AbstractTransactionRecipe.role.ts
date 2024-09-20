/* eslint-disable camelcase */
import { Transaction } from '@entity/Transaction'
import {
  GradidoTransaction,
  GradidoTransactionBuilder,
  InteractionSerialize,
  InteractionValidate,
  MemoryBlock,
  TransactionType_COMMUNITY_ROOT,
  ValidateType_SINGLE,
} from 'gradido-blockchain-js'

import { sendMessage as iotaSendMessage } from '@/client/IotaClient'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionError } from '@/graphql/model/TransactionError'
import { logger } from '@/logging/logger'

export abstract class AbstractTransactionRecipeRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(protected self: Transaction) {}

  public abstract transmitToIota(): Promise<Transaction>
  public abstract getCrossGroupTypeName(): string

  public validate(transactionBuilder: GradidoTransactionBuilder): GradidoTransaction {
    const transaction = transactionBuilder.build()
    try {
      // throw an exception when something is wrong
      const validator = new InteractionValidate(transaction)
      validator.run(ValidateType_SINGLE)
    } catch (e) {
      if (e instanceof Error) {
        throw new TransactionError(TransactionErrorType.VALIDATION_ERROR, e.message)
      } else if (typeof e === 'string') {
        throw new TransactionError(TransactionErrorType.VALIDATION_ERROR, e)
      } else {
        throw e
      }
    }
    return transaction
  }

  protected getGradidoTransactionBuilder(): GradidoTransactionBuilder {
    if (!this.self.signature) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'missing signature in transaction recipe',
      )
    }
    let publicKey: Buffer | undefined
    if (this.self.type === TransactionType_COMMUNITY_ROOT) {
      publicKey = this.self.community.rootPubkey
      if (!publicKey) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing community public key for community root transaction',
        )
      }
    } else if (this.self.signingAccount) {
      publicKey = this.self.signingAccount.derive2Pubkey
      if (!publicKey) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing signing account public key for transaction',
        )
      }
    } else {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "signingAccount not exist and it isn't a community root transaction",
      )
    }
    return new GradidoTransactionBuilder()
      .setTransactionBody(new MemoryBlock(this.self.bodyBytes))
      .addSignaturePair(new MemoryBlock(publicKey), new MemoryBlock(this.self.signature))
  }

  /**
   *
   * @param gradidoTransaction
   * @param topic
   * @return iota message id
   */
  protected async sendViaIota(
    gradidoTransaction: GradidoTransaction,
    topic: string,
  ): Promise<Buffer> {
    // protobuf serializing function
    const serialized = new InteractionSerialize(gradidoTransaction).run()
    if (!serialized) {
      throw new TransactionError(
        TransactionErrorType.PROTO_ENCODE_ERROR,
        'cannot serialize transaction',
      )
    }
    const resultMessage = await iotaSendMessage(
      Uint8Array.from(serialized.data()),
      Uint8Array.from(Buffer.from(topic, 'hex')),
    )
    logger.info('transmitted Gradido Transaction to Iota', {
      id: this.self.id,
      messageId: resultMessage.messageId,
    })
    return Buffer.from(resultMessage.messageId, 'hex')
  }
}

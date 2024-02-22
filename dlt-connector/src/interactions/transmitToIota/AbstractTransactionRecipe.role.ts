import { Transaction } from '@entity/Transaction'

import { sendMessage as iotaSendMessage } from '@/client/IotaClient'
import { KeyPair } from '@/data/KeyPair'
import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { SignaturePair } from '@/data/proto/3_3/SignaturePair'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionError } from '@/graphql/model/TransactionError'
import { GradidoTransactionLoggingView } from '@/logging/GradidoTransactionLogging.view'
import { logger } from '@/logging/logger'

export abstract class AbstractTransactionRecipeRole {
  protected transactionBody: TransactionBody
  public constructor(protected self: Transaction) {
    this.transactionBody = TransactionBody.fromBodyBytes(this.self.bodyBytes)
  }

  public abstract transmitToIota(): Promise<Transaction>

  protected getGradidoTransaction(): GradidoTransaction {
    const transaction = new GradidoTransaction(this.transactionBody)
    if (!this.self.signature) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'missing signature in transaction recipe',
      )
    }
    const signaturePair = new SignaturePair()
    if (this.self.signature.length !== 64) {
      throw new TransactionError(TransactionErrorType.INVALID_SIGNATURE, "signature isn't 64 bytes")
    }
    signaturePair.signature = this.self.signature
    if (this.transactionBody.communityRoot) {
      const publicKey = this.self.community.rootPubkey
      if (!publicKey) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing community public key for community root transaction',
        )
      }
      signaturePair.pubKey = publicKey
    } else if (this.self.signingAccount) {
      const publicKey = this.self.signingAccount.derive2Pubkey
      if (!publicKey) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing signing account public key for transaction',
        )
      }
      signaturePair.pubKey = publicKey
    } else {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "signingAccount not exist and it isn't a community root transaction",
      )
    }
    if (signaturePair.validate()) {
      transaction.sigMap.sigPair.push(signaturePair)
    }
    if (!KeyPair.verify(transaction.bodyBytes, signaturePair)) {
      logger.debug('invalid signature', new GradidoTransactionLoggingView(transaction))
      throw new TransactionError(TransactionErrorType.INVALID_SIGNATURE, 'signature is invalid')
    }
    return transaction
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
    const messageBuffer = GradidoTransaction.encode(gradidoTransaction).finish()
    const resultMessage = await iotaSendMessage(
      messageBuffer,
      Uint8Array.from(Buffer.from(topic, 'hex')),
    )
    logger.info('transmitted Gradido Transaction to Iota', {
      id: this.self.id,
      messageId: resultMessage.messageId,
    })
    return Buffer.from(resultMessage.messageId, 'hex')
  }
}

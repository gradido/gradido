import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { IsNull } from 'typeorm'

import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { SignaturePair } from '@/data/proto/3_3/SignaturePair'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionType } from '@/graphql/enum/TransactionType'
import { TransactionError } from '@/graphql/model/TransactionError'
import { GradidoTransactionLoggingView } from '@/logging/GradidoTransactionLogging.view'
import { logger } from '@/logging/logger'

import { verify } from './GradidoTransaction'

export class TransactionRecipe {
  private body: TransactionBody | undefined = undefined

  // eslint-disable-next-line no-useless-constructor
  public constructor(private recipeEntity: Transaction) {}

  public getBody(): TransactionBody {
    if (!this.body) {
      try {
        this.body = TransactionBody.decode(new Uint8Array(this.recipeEntity.bodyBytes))
      } catch (error) {
        logger.error('error decoding body from gradido transaction: %s', error)
        throw new TransactionError(
          TransactionErrorType.PROTO_DECODE_ERROR,
          'cannot decode body from gradido transaction',
        )
      }
    }
    return this.body
  }

  public getTransactionRecipeEntity(): Transaction {
    return this.recipeEntity
  }

  public getGradidoTransaction(): { transaction: GradidoTransaction; body: TransactionBody } {
    const body = this.getBody()
    const transaction = new GradidoTransaction(body)
    if (!this.recipeEntity.signature) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'missing signature in transaction recipe',
      )
    }
    const signaturePair = new SignaturePair()
    if (this.recipeEntity.signature.length !== 64) {
      throw new TransactionError(TransactionErrorType.INVALID_SIGNATURE, "signature isn't 64 bytes")
    }
    signaturePair.signature = this.recipeEntity.signature
    if (body.communityRoot) {
      const publicKey = this.recipeEntity.community.rootPubkey
      if (!publicKey) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing community public key for community root transaction',
        )
      }
      signaturePair.pubKey = publicKey
    } else if (this.recipeEntity.signingAccount) {
      const publicKey = this.recipeEntity.signingAccount.derive2Pubkey
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
    if (!verify(transaction)) {
      logger.debug('invalid signature', new GradidoTransactionLoggingView(transaction))
      throw new TransactionError(TransactionErrorType.INVALID_SIGNATURE, 'signature is invalid')
    }
    transaction.parentMessageId = this.recipeEntity.iotaMessageId
    return { transaction, body }
  }

  public getBalanceAccount(): Account | undefined | null {
    const body = this.getBody()
    switch (body.getTransactionType()) {
      case TransactionType.GRADIDO_CREATION:
        return this.recipeEntity.recipientAccount
      case TransactionType.GRADIDO_TRANSFER:
      case TransactionType.GRADIDO_DEFERRED_TRANSFER:
        return this.recipeEntity.signingAccount
      case TransactionType.REGISTER_ADDRESS:
      case TransactionType.COMMUNITY_ROOT:
      case TransactionType.GROUP_FRIENDS_UPDATE:
        return null
    }
  }

  public getMessageIdHex(): string | undefined {
    return this.recipeEntity.iotaMessageId?.toString('hex')
  }
}

export const getNextPendingTransaction = async (): Promise<Transaction | null> => {
  return await Transaction.findOne({
    where: { iotaMessageId: IsNull() },
    order: { createdAt: 'ASC' },
    relations: { signingAccount: true },
  })
}

export const findByMessageId = (iotaMessageId: string): Promise<Transaction | null> => {
  return Transaction.findOneBy({ iotaMessageId: Buffer.from(iotaMessageId, 'hex') })
}

import { Resolver, Arg, Mutation } from 'type-graphql'

import { TransactionDraft } from '@input/TransactionDraft'

import { create as createTransactionBody } from '@controller/TransactionBody'
import { create as createGradidoTransaction } from '@controller/GradidoTransaction'

import { TransactionResult } from '../model/TransactionResult'
import { TransactionError } from '../model/TransactionError'
import { TransactionRecipe, findByMessageId, findBySignature } from '@/controller/TransactionRecipe'
import { TransactionRecipe as TransactionRecipeOutput } from '@model/TransactionRecipe'
import { KeyManager } from '@/controller/KeyManager'
import { findAccountByUserIdentifier, getKeyPair } from '@/controller/Account'
import { TransactionErrorType } from '../enum/TransactionErrorType'
import { CrossGroupType } from '@/data/proto/3_3/enum/CrossGroupType'
import { logger } from '@/server/logger'
import { ConfirmedTransaction } from '@/data/proto/3_3/ConfirmedTransaction'
import { TransactionsManager } from '@/controller/TransactionsManager'
import { confirmFromNodeServer } from '@/controller/ConfirmedTransaction'
import { ConfirmedTransactionInput } from '../input/ConfirmedTransactionInput'
import { ConditionalSleepManager } from '@/utils/ConditionalSleepManager'
import { TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY } from '@/tasks/transmitToIota'
import { InvalidTransactionInput } from '../input/InvalidTransactionInput'
import { InvalidTransaction } from '@entity/InvalidTransaction'

@Resolver()
export class TransactionResolver {
  @Mutation(() => TransactionResult)
  async sendTransaction(
    @Arg('data')
    transaction: TransactionDraft,
  ): Promise<TransactionResult> {
    try {
      logger.info('sendTransaction call', transaction)
      const signingAccount = await findAccountByUserIdentifier(transaction.senderUser)
      if (!signingAccount) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found sender user account in db",
        )
      }
      logger.info('signing account', signingAccount)

      const recipientAccount = await findAccountByUserIdentifier(transaction.recipientUser)
      if (!recipientAccount) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found recipient user account in db",
        )
      }
      logger.info('recipient account', recipientAccount)

      const body = createTransactionBody(transaction, signingAccount, recipientAccount)
      logger.info('body', body)
      const gradidoTransaction = createGradidoTransaction(body)

      const signingKeyPair = getKeyPair(signingAccount)
      if (!signingKeyPair) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found signing key pair",
        )
      }
      logger.info('key pair for signing', signingKeyPair)

      KeyManager.getInstance().sign(gradidoTransaction, [signingKeyPair])
      const recipeTransactionController = await TransactionRecipe.create({
        transaction: gradidoTransaction,
        senderUser: transaction.senderUser,
        recipientUser: transaction.recipientUser,
        signingAccount,
        recipientAccount,
        backendTransactionId: transaction.backendTransactionId,
      })
      try {
        await recipeTransactionController.getTransactionRecipeEntity().save()
        ConditionalSleepManager.getInstance().signal(TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY' && body.type === CrossGroupType.LOCAL) {
          const existingRecipe = await findBySignature(
            gradidoTransaction.sigMap.sigPair[0].signature,
          )
          if (!existingRecipe) {
            throw new TransactionError(
              TransactionErrorType.LOGIC_ERROR,
              "recipe cannot be added because signature exist but couldn't load this existing receipt",
            )
          }
          return new TransactionResult(new TransactionRecipeOutput(existingRecipe))
        } else {
          throw error
        }
      }
      return new TransactionResult()
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }

  // called from gradido node after a new block was confirmed
  @Mutation(() => TransactionResult)
  async newGradidoBlock(
    @Arg('data') { transactionBase64, iotaTopic }: ConfirmedTransactionInput,
  ): Promise<TransactionResult> {
    if (!TransactionsManager.getInstance().isTopicExist(iotaTopic)) {
      return new TransactionResult(
        new TransactionError(TransactionErrorType.NOT_FOUND, 'topic not found'),
      )
    }
    try {
      logger.debug('transaction in base64', transactionBase64)
      const confirmedTransaction = ConfirmedTransaction.fromBase64(transactionBase64)
      logger.debug('confirmed Transaction from NodeServer', confirmedTransaction.toJSON())
      await confirmFromNodeServer([confirmedTransaction], iotaTopic)
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      }
      logger.error('error on call newGradidoBlock', error)
      return new TransactionResult(
        new TransactionError(
          TransactionErrorType.LOGIC_ERROR,
          'not expected error, see dlt-connector log for further details',
        ),
      )
    }
    return new TransactionResult()
  }

  @Mutation(() => TransactionResult)
  async failedGradidoBlock(
    @Arg('data') { iotaMessageId, errorMessage }: InvalidTransactionInput,
  ): Promise<TransactionResult> {
    const transactionReceipt = await findByMessageId(iotaMessageId)
    if (transactionReceipt) {
      logger.error('invalid transaction', errorMessage, transactionReceipt)
    } else {
      logger.info("invalid transaction (but we haven't create it)", errorMessage, iotaMessageId)
    }
    const invalidTransaction = InvalidTransaction.create()
    invalidTransaction.iotaMessageId = Buffer.from(iotaMessageId, 'hex')
    try {
      invalidTransaction.save()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code !== 'ER_DUP_ENTRY') {
        return new TransactionResult(
          new TransactionError(
            TransactionErrorType.DB_ERROR,
            'error by save invalidTransaction: ' + error,
          ),
        )
      }
    }
    return new TransactionResult()
  }
}

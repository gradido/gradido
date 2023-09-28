import { Resolver, Arg, Mutation } from 'type-graphql'

import { TransactionDraft } from '@input/TransactionDraft'

import { create as createTransactionBody } from '@controller/TransactionBody'
import { create as createGradidoTransaction } from '@controller/GradidoTransaction'

import { TransactionResult } from '../model/TransactionResult'
import { TransactionError } from '../model/TransactionError'
import { TransactionRecipe, findBySignature } from '@/controller/TransactionRecipe'
import { TransactionRecipe as TransactionRecipeOutput } from '@model/TransactionRecipe'
import { KeyManager } from '@/controller/KeyManager'
import {
  createFromUserAccountDraft,
  findAccountByUserIdentifier,
  getKeyPair,
} from '@/controller/Account'
import { TransactionErrorType } from '../enum/TransactionErrorType'
import { CrossGroupType } from '@/proto/3_3/enum/CrossGroupType'
import { UserAccountDraft } from '@input/UserAccountDraft'
import { create as createUser, findByGradidoId } from '@/controller/User'
import { ConditionalSleepManager } from '@/utils/ConditionalSleepManager'
import { logger } from '@/server/logger'
import { getDataSource } from '@/typeorm/DataSource'
import { TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY } from '@/tasks/transmitToIota'

@Resolver()
export class TransactionResolver {
  @Mutation(() => TransactionResult)
  async registerAddress(
    @Arg('data')
    userAccountDraft: UserAccountDraft,
  ): Promise<TransactionResult> {
    try {
      let user = await findByGradidoId(userAccountDraft.user)
      if (!user) {
        user = createUser(userAccountDraft)
      }
      const account = createFromUserAccountDraft(userAccountDraft, user)
      const body = createTransactionBody(userAccountDraft, account)
      const gradidoTransaction = createGradidoTransaction(body)
      const signingKeyPair = getKeyPair(account)
      if (!signingKeyPair) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found signing key pair",
        )
      }
      KeyManager.getInstance().sign(gradidoTransaction, [signingKeyPair])
      const recipeTransactionController = await TransactionRecipe.create({
        transaction: gradidoTransaction,
        senderUser: userAccountDraft.user,
        signingAccount: account,
      })
      const recipeTransaction = recipeTransactionController.getTransactionRecipeEntity()
      const queryRunner = getDataSource().createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      let result: TransactionResult
      try {
        if (!user.hasId()) {
          await queryRunner.manager.save(user)
        }
        await queryRunner.manager.save(account)
        await queryRunner.manager.save(recipeTransaction)
        await queryRunner.commitTransaction()
        ConditionalSleepManager.getInstance().signal(TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY)
        result = new TransactionResult(new TransactionRecipeOutput(recipeTransaction))
      } catch (err) {
        logger.error('error saving user or new account into db: %s', err)
        result = new TransactionResult(
          new TransactionError(
            TransactionErrorType.DB_ERROR,
            'error saving user or new account into db',
          ),
        )
        await queryRunner.rollbackTransaction()
      } finally {
        await queryRunner.release()
      }
      return result
    } catch (error) {
      if (error instanceof TransactionError) {
        return new TransactionResult(error)
      } else {
        throw error
      }
    }
  }

  @Mutation(() => TransactionResult)
  async sendTransaction(
    @Arg('data')
    transaction: TransactionDraft,
  ): Promise<TransactionResult> {
    try {
      const signingAccount = await findAccountByUserIdentifier(transaction.senderUser)
      if (!signingAccount) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found sender user account in db",
        )
      }
      const recipientAccount = await findAccountByUserIdentifier(transaction.recipientUser)
      if (!recipientAccount) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found recipient user account in db",
        )
      }
      const body = createTransactionBody(transaction, signingAccount, recipientAccount)
      const gradidoTransaction = createGradidoTransaction(body)

      const signingKeyPair = getKeyPair(signingAccount)
      if (!signingKeyPair) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found signing key pair",
        )
      }
      KeyManager.getInstance().sign(gradidoTransaction, [signingKeyPair])
      const recipeTransactionController = await TransactionRecipe.create({
        transaction: gradidoTransaction,
        senderUser: transaction.senderUser,
        recipientUser: transaction.recipientUser,
        signingAccount,
        recipientAccount,
      })
      try {
        await recipeTransactionController.getTransactionRecipeEntity().save()
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
}

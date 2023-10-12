import { Arg, Mutation, Resolver } from 'type-graphql'
import { TransactionResult } from '../model/TransactionResult'
import { UserAccountDraft } from '../input/UserAccountDraft'
import { create as createUser, findByGradidoId } from '@/controller/User'
import {
  createFromUserAccountDraft,
  findAccountByUserIdentifier,
  getKeyPair,
} from '@/controller/Account'
import { create as createTransactionBody } from '@controller/TransactionBody'
import { create as createGradidoTransaction } from '@controller/GradidoTransaction'
import { TransactionError } from '../model/TransactionError'
import { TransactionErrorType } from '../enum/TransactionErrorType'
import { KeyManager } from '@/controller/KeyManager'
import { TransactionRecipe } from '@/controller/TransactionRecipe'
import { getDataSource } from '@/typeorm/DataSource'
import { ConditionalSleepManager } from '@/utils/ConditionalSleepManager'
import { TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY } from '@/tasks/transmitToIota'
import { logger } from '@/server/logger'
import { TransactionRecipe as TransactionRecipeOutput } from '@model/TransactionRecipe'

@Resolver()
export class AccountResolver {
  @Mutation(() => TransactionResult)
  async registerAddress(
    @Arg('data')
    userAccountDraft: UserAccountDraft,
  ): Promise<TransactionResult> {
    try {
      let user = await findByGradidoId(userAccountDraft.user)
      if (!user) {
        user = createUser(userAccountDraft)
      } else {
        const account = await findAccountByUserIdentifier(userAccountDraft.user)
        if (account) {
          return new TransactionResult(
            new TransactionError(
              TransactionErrorType.ALREADY_EXIST,
              'account for this user already exist!',
            ),
          )
        }
      }
      logger.info('add user and account', userAccountDraft)
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
        logger.info('new user/account and transactionRecipe written into db')
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
        logger.error('error in register address: ', error)
        throw error
      }
    }
  }
}

import { TransactionBuilder } from '@/data/Transaction.builder'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionRecipe } from '@/graphql/model/TransactionRecipe'
import { TransactionResult } from '@/graphql/model/TransactionResult'
import { logger } from '@/server/logger'
import { TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY } from '@/tasks/transmitToIota'
import { getDataSource } from '@/typeorm/DataSource'
import { ConditionalSleepManager } from '@/utils/ConditionalSleepManager'
import { QueryRunner } from 'typeorm'

export abstract class TransactionRecipeRole {
  protected transactionBuilder: TransactionBuilder
  construct() {
    this.transactionBuilder = new TransactionBuilder()
  }

  public async storeAsTransaction(
    transactionFunction: (queryRunner: QueryRunner) => Promise<void>,
  ): Promise<TransactionResult> {
    const queryRunner = getDataSource().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    let result: TransactionResult
    try {
      const transactionRecipe = this.transactionBuilder.build()
      await transactionFunction(queryRunner)
      await queryRunner.manager.save(transactionRecipe)
      await queryRunner.commitTransaction()
      ConditionalSleepManager.getInstance().signal(TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY)
      result = new TransactionResult(new TransactionRecipe(transactionRecipe))
    } catch (err) {
      logger.error('error saving new transaction recipe into db: %s', err)
      result = new TransactionResult(
        new TransactionError(
          TransactionErrorType.DB_ERROR,
          'error saving transaction recipe into db',
        ),
      )
      await queryRunner.rollbackTransaction()
    } finally {
      await queryRunner.release()
    }
    return result
  }
}

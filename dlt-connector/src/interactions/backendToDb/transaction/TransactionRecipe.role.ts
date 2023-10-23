import { TransactionBuilder } from '@/data/Transaction.builder'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionRecipe } from '@/graphql/model/TransactionRecipe'
import { TransactionResult } from '@/graphql/model/TransactionResult'
import { logger } from '@/server/logger'
import { getDataSource } from '@/typeorm/DataSource'
import { QueryRunner } from 'typeorm'

export class TransactionRecipeRole {
  protected transactionBuilder: TransactionBuilder
  construct() {
    this.transactionBuilder = new TransactionBuilder()
  }

  public createFromTransactionDraft(transactionDraft: TransactionDraft): TransactionRecipeRole {
    return this
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

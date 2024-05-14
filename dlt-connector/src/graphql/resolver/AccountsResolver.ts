import { Arg, Mutation, Query, Resolver } from 'type-graphql'
import { QueryFailedError } from 'typeorm'

import { TransactionRecipe } from '@model/TransactionRecipe'

import { TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY } from '@/data/const'
import { UserRepository } from '@/data/User.repository'
import { RegisterAddressContext } from '@/interactions/backendToDb/account/RegisterAddress.context'
import { AccountLoggingView } from '@/logging/AccountLogging.view'
import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { InterruptiveSleepManager } from '@/manager/InterruptiveSleepManager'
import { getDataSource } from '@/typeorm/DataSource'

import { TransactionErrorType } from '../enum/TransactionErrorType'
import { UserAccountDraft } from '../input/UserAccountDraft'
import { UserIdentifier } from '../input/UserIdentifier'
import { TransactionError } from '../model/TransactionError'
import { TransactionResult } from '../model/TransactionResult'

@Resolver()
export class AccountResolver {
  @Query(() => Boolean)
  async isAccountExist(@Arg('data') userIdentifier: UserIdentifier): Promise<boolean> {
    logger.info('isAccountExist', userIdentifier)
    return !!(await UserRepository.findAccountByUserIdentifier(userIdentifier))
  }

  @Mutation(() => TransactionResult)
  async registerAddress(
    @Arg('data')
    userAccountDraft: UserAccountDraft,
  ): Promise<TransactionResult> {
    const registerAddressContext = new RegisterAddressContext(userAccountDraft)
    try {
      const { transaction, account } = await registerAddressContext.run()
      logger.info('register address', {
        account: new AccountLoggingView(account),
        transaction: new TransactionLoggingView(transaction),
      })
      await getDataSource().transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(account)
        await transactionalEntityManager.save(transaction)
        logger.debug('store register address transaction', new TransactionLoggingView(transaction))
      })
      InterruptiveSleepManager.getInstance().interrupt(TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY)
      return new TransactionResult(new TransactionRecipe(transaction))
    } catch (err) {
      if (err instanceof QueryFailedError) {
        logger.error('error saving user or new account or transaction into db: %s', err)
        return new TransactionResult(
          new TransactionError(
            TransactionErrorType.DB_ERROR,
            'error saving user or new account or transaction into db',
          ),
        )
      } else if (err instanceof TransactionError) {
        return new TransactionResult(err)
      } else {
        logger.error('error in register address: ', err)
        throw err
      }
    }
  }
}

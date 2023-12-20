import { Account } from '@entity/Account'
import { Arg, Mutation, Query, Resolver } from 'type-graphql'

import { TransactionRecipe as TransactionRecipeOutput } from '@model/TransactionRecipe'

import { AccountFactory } from '@/data/Account.factory'
import { AccountLogic } from '@/data/Account.logic'
import { AccountRepository } from '@/data/Account.repository'
import { CommunityRepository } from '@/data/Community.repository'
import { TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY } from '@/data/const'
import { TransactionBodyBuilder } from '@/data/proto/TransactionBody.builder'
import { TransactionBuilder } from '@/data/Transaction.builder'
import { UserFactory } from '@/data/User.factory'
import { UserLogic } from '@/data/User.logic'
import { UserRepository } from '@/data/User.repository'
import { logger } from '@/logging/logger'
import { getDataSource } from '@/typeorm/DataSource'
import { ConditionalSleepManager } from '@/utils/ConditionalSleepManager'

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
    const user = await UserRepository.findByIdentifier(userIdentifier)
    if (user) {
      if (user.accounts) {
        return (
          user.accounts.filter(
            (value: Account) => value.derivationIndex === userIdentifier.accountNr,
          ).length === 1
        )
      }
    }
    return false
  }

  @Mutation(() => TransactionResult)
  async registerAddress(
    @Arg('data')
    userAccountDraft: UserAccountDraft,
  ): Promise<TransactionResult> {
    const communityKeyPair = await CommunityRepository.loadHomeCommunityKeyPair()
    try {
      let user = await UserRepository.findByGradidoId(userAccountDraft.user)
      if (!user) {
        user = UserFactory.create(userAccountDraft, communityKeyPair)
      } else {
        const account = await AccountRepository.findByUserIdentifier(userAccountDraft.user)
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
      const userKeyPair = new UserLogic(user).calculateKeyPair(communityKeyPair)
      const account = AccountFactory.createFromUserAccountDraft(userAccountDraft, userKeyPair)
      const bodyBuilder = new TransactionBodyBuilder()
      const transactionBuilder = new TransactionBuilder()
      const signingKeyPair = new AccountLogic(account).getKeyPair(communityKeyPair)
      if (!signingKeyPair) {
        throw new TransactionError(
          TransactionErrorType.NOT_FOUND,
          "couldn't found signing key pair",
        )
      }
      const transaction = transactionBuilder
        .fromTransactionBodyBuilder(
          bodyBuilder.fromUserAccountDraft(userAccountDraft, user, account),
        )
        .sign(signingKeyPair)
        .setSigningAccount(account)
        .setHomeCommunityAsCommunity()
        .build()
      const queryRunner = getDataSource().createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      let result: TransactionResult
      try {
        await queryRunner.manager.save(account)
        await queryRunner.manager.save(transaction)
        await queryRunner.commitTransaction()
        logger.info('new user/account and transactionRecipe written into db')
        ConditionalSleepManager.getInstance().signal(TRANSMIT_TO_IOTA_SLEEP_CONDITION_KEY)
        result = new TransactionResult(new TransactionRecipeOutput(transaction))
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

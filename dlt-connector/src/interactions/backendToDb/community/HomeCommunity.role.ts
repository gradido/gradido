import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'

import { CONFIG } from '@/config'
import { AccountFactory } from '@/data/Account.factory'
import { KeyPair } from '@/data/KeyPair'
import { Mnemonic } from '@/data/Mnemonic'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { CommunityLoggingView } from '@/logging/CommunityLogging.view'
import { logger } from '@/logging/logger'
import { TransactionLoggingView } from '@/logging/TransactionLogging.view'
import { getDataSource } from '@/typeorm/DataSource'

import { CreateTransactionRecipeContext } from '../transaction/CreateTransationRecipe.context'

import { CommunityRole } from './Community.role'

export class HomeCommunityRole extends CommunityRole {
  private transactionRecipe: Transaction

  public async create(communityDraft: CommunityDraft, topic: string): Promise<void> {
    super.create(communityDraft, topic)
    // generate key pair for signing transactions and deriving all keys for community
    const keyPair = new KeyPair(new Mnemonic(CONFIG.IOTA_HOME_COMMUNITY_SEED ?? undefined))
    keyPair.fillInCommunityKeys(this.self)

    // create auf account and gmw account
    this.self.aufAccount = AccountFactory.createAufAccount(keyPair, this.self.createdAt)
    this.self.gmwAccount = AccountFactory.createGmwAccount(keyPair, this.self.createdAt)

    const transactionRecipeContext = new CreateTransactionRecipeContext(communityDraft)
    transactionRecipeContext.setCommunity(this.self)
    await transactionRecipeContext.run()
    this.transactionRecipe = transactionRecipeContext.getTransactionRecipe()
  }

  public async store(): Promise<Community> {
    try {
      return await getDataSource().transaction(async (transactionalEntityManager) => {
        logger.debug('store new home community', new CommunityLoggingView(this.self))
        const community = await transactionalEntityManager.save(this.self)
        logger.debug(
          'store community root transaction',
          new TransactionLoggingView(this.transactionRecipe),
        )
        await transactionalEntityManager.save(this.transactionRecipe)
        return community
      })
    } catch (error) {
      logger.error('error saving home community into db: %s', error)
      throw new TransactionError(
        TransactionErrorType.DB_ERROR,
        'error saving home community into db',
      )
    }
  }
}

import { Community } from '@entity/Community'
import { Transaction } from '@entity/Transaction'

import { CONFIG } from '@/config'
import { AccountFactory } from '@/data/Account.factory'
import { TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY } from '@/data/const'
import { KeyPair } from '@/data/KeyPair'
import { Mnemonic } from '@/data/Mnemonic'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { CommunityLoggingView } from '@/logging/CommunityLogging.view'
import { logger } from '@/logging/logger'
import { InterruptiveSleepManager } from '@/manager/InterruptiveSleepManager'
import { LogError } from '@/server/LogError'
import { getDataSource } from '@/typeorm/DataSource'

import { CreateTransactionRecipeContext } from '../transaction/CreateTransationRecipe.context'

import { CommunityRole } from './Community.role'

export class HomeCommunityRole extends CommunityRole {
  private transactionRecipe: Transaction

  public async create(communityDraft: CommunityDraft, topic: string): Promise<void> {
    super.create(communityDraft, topic)
    // generate key pair for signing transactions and deriving all keys for community
    let mnemonic: Mnemonic
    try {
      mnemonic = new Mnemonic(CONFIG.IOTA_HOME_COMMUNITY_SEED ?? undefined)
    } catch (e) {
      throw new LogError(
        'error creating mnemonic for home community, please fill IOTA_HOME_COMMUNITY_SEED in .env',
        {
          IOTA_HOME_COMMUNITY_SEED: CONFIG.IOTA_HOME_COMMUNITY_SEED,
          error: e,
        },
      )
    }
    const keyPair = new KeyPair(mnemonic)
    keyPair.fillInCommunityKeys(this.self)

    // create auf account and gmw account
    this.self.aufAccount = AccountFactory.createAufAccount(keyPair, this.self.createdAt)
    this.self.gmwAccount = AccountFactory.createGmwAccount(keyPair, this.self.createdAt)

    const transactionRecipeContext = new CreateTransactionRecipeContext(communityDraft, this.self)
    await transactionRecipeContext.run()
    this.transactionRecipe = transactionRecipeContext.getTransactionRecipe()
  }

  public async store(): Promise<Community> {
    try {
      const community = await getDataSource().transaction(async (transactionalEntityManager) => {
        const community = await transactionalEntityManager.save(this.self)
        await transactionalEntityManager.save(this.transactionRecipe)
        logger.debug('store home community', new CommunityLoggingView(community))
        return community
      })
      InterruptiveSleepManager.getInstance().interrupt(TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY)
      return community
    } catch (error) {
      logger.error('error saving home community into db: %s', error)
      throw new TransactionError(
        TransactionErrorType.DB_ERROR,
        'error saving home community into db',
      )
    }
  }
}

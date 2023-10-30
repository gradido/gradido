import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'
import { CommunityRole } from './Community.role'
import { Transaction } from '@entity/Transaction'
import { KeyManager } from '@/manager/KeyManager'
import { AccountFactory } from '@/data/Account.factory'
import { CreateTransactionRecipeContext } from '../transaction/CreateTransationRecipe.context'
import { logger } from '@/server/logger'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { getDataSource } from '@/typeorm/DataSource'

export class HomeCommunityRole extends CommunityRole {
  private transactionRecipe: Transaction

  public async create(communityDraft: CommunityDraft, topic: string): Promise<void> {
    super.create(communityDraft, topic)
    // generate key pair for signing transactions and deriving all keys for community
    const keyPair = KeyManager.generateKeyPair()
    this.self.rootPubkey = keyPair.publicKey
    this.self.rootPrivkey = keyPair.privateKey
    this.self.rootChaincode = keyPair.chainCode
    // we should only have one home community per server
    KeyManager.getInstance().setHomeCommunityKeyPair(keyPair)

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
        await transactionalEntityManager.save(this.transactionRecipe)
        return await transactionalEntityManager.save(this.self)
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

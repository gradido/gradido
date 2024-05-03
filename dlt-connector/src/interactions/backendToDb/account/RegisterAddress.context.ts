import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { User } from '@entity/User'

import { AccountFactory } from '@/data/Account.factory'
import { CommunityRepository } from '@/data/Community.repository'
import { KeyPair } from '@/data/KeyPair'
import { UserFactory } from '@/data/User.factory'
import { UserLogic } from '@/data/User.logic'
import { UserRepository } from '@/data/User.repository'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { logger } from '@/logging/logger'

import { CreateTransactionRecipeContext } from '../transaction/CreateTransactionRecipe.context'

export interface TransactionWithAccount {
  transaction: Transaction
  account: Account
}

export class RegisterAddressContext {
  // eslint-disable-next-line no-useless-constructor
  public constructor(private userAccountDraft: UserAccountDraft) {}

  public async run(): Promise<TransactionWithAccount> {
    const communityKeyPair = await CommunityRepository.loadHomeCommunityKeyPair()
    const user = await this.loadOrCreateUser(communityKeyPair)
    if (this.isAccountAlreadyExistOnUser(user)) {
      throw new TransactionError(
        TransactionErrorType.ALREADY_EXIST,
        'account for this user already exist!',
      )
    }
    logger.info('add user and account', this.userAccountDraft)
    const account = this.createAccount(new UserLogic(user).calculateKeyPair(communityKeyPair))
    account.user = user
    const createTransactionContext = new CreateTransactionRecipeContext(this.userAccountDraft, {
      account,
    })
    await createTransactionContext.run()
    return { transaction: createTransactionContext.getTransactionRecipe(), account }
  }

  public isAccountAlreadyExistOnUser(user: User): boolean {
    return !!user.accounts?.find(
      (value) => value.derivationIndex === this.userAccountDraft.user.accountNr,
    )
  }

  public async loadOrCreateUser(communityKeyPair: KeyPair): Promise<User> {
    let user = await UserRepository.findByGradidoId(this.userAccountDraft.user, { accounts: true })
    if (!user) {
      user = UserFactory.create(this.userAccountDraft, communityKeyPair)
    }
    return user
  }

  public createAccount(userKeyPair: KeyPair): Account {
    return AccountFactory.createAccountFromUserAccountDraft(this.userAccountDraft, userKeyPair)
  }
}

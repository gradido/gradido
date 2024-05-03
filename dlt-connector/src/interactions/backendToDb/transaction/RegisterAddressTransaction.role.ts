import { Account } from '@entity/Account'

import { AccountLogic } from '@/data/Account.logic'
import { CommunityRepository } from '@/data/Community.repository'
import { TransactionBodyBuilder } from '@/data/proto/TransactionBody.builder'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { AbstractTransactionRecipeRole } from './AbstractTransactionRecipeRole'

export class RegisterAddressTransactionRole extends AbstractTransactionRecipeRole {
  async create(
    userAccountDraft: UserAccountDraft,
    account: Account,
  ): Promise<AbstractTransactionRecipeRole> {
    const bodyBuilder = new TransactionBodyBuilder()
    const communityKeyPair = await CommunityRepository.loadHomeCommunityKeyPair()
    const signingKeyPair = new AccountLogic(account).calculateKeyPair(communityKeyPair)
    if (!signingKeyPair) {
      throw new TransactionError(TransactionErrorType.NOT_FOUND, "couldn't found signing key pair")
    }
    this.transactionBuilder
      .fromTransactionBodyBuilder(bodyBuilder.fromUserAccountDraft(userAccountDraft, account))
      .setSignature(signingKeyPair.sign(this.transactionBuilder.getTransaction().bodyBytes))
      .setSigningAccount(account)
    return this
  }
}

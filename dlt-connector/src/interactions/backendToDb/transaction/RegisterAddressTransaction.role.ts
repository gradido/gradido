import { Account } from '@entity/Account'
import { Community } from '@entity/Community'
import {
  // eslint-disable-next-line camelcase
  AddressType_COMMUNITY_HUMAN,
  MemoryBlock,
  GradidoTransactionBuilder,
} from 'gradido-blockchain-js'

import { AccountLogic } from '@/data/Account.logic'
import { CommunityRepository } from '@/data/Community.repository'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { AbstractTransactionRecipeRole } from './AbstractTransactionRecipeRole'

export class RegisterAddressTransactionRole extends AbstractTransactionRecipeRole {
  async create(
    userAccountDraft: UserAccountDraft,
    account: Account,
    community: Community,
  ): Promise<RegisterAddressTransactionRole> {
    const user = account.user
    if (!user) {
      throw new TransactionError(TransactionErrorType.MISSING_PARAMETER, 'missing user for account')
    }
    const gradidoTransactionBuilder = new GradidoTransactionBuilder()
    const communityKeyPair = await CommunityRepository.loadHomeCommunityKeyPair()
    const signingKeyPair = new AccountLogic(account).calculateKeyPair(communityKeyPair)
    if (!signingKeyPair) {
      throw new TransactionError(TransactionErrorType.NOT_FOUND, "couldn't found signing key pair")
    }
    const transaction = gradidoTransactionBuilder
      .setRegisterAddress(
        new MemoryBlock(user.derive1Pubkey),
        AddressType_COMMUNITY_HUMAN,
        null,
        new MemoryBlock(account.derive2Pubkey),
      )
      .setCreatedAt(new Date(userAccountDraft.createdAt))
      .sign(signingKeyPair.keyPair)
      .sign(communityKeyPair.keyPair)
      .build()

    this.transactionBuilder
      .fromGradidoTransaction(transaction)
      .setCommunity(community)
      .setSigningAccount(account)
    return this
  }
}

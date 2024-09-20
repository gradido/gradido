/* eslint-disable camelcase */
import { AccountLogic } from '@/data/Account.logic'
import { KeyPair } from '@/data/KeyPair'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { AbstractTransactionRecipeRole } from './AbstractTransactionRecipeRole'

export class BalanceChangingTransactionRecipeRole extends AbstractTransactionRecipeRole {
  public async create(
    transactionDraft: TransactionDraft,
    transactionTypeRole: AbstractTransactionRole,
  ): Promise<BalanceChangingTransactionRecipeRole> {
    // loading signing and recipient account
    const signingAccount = await transactionTypeRole.loadUser(transactionTypeRole.getSigningUser())
    const recipientAccount = await transactionTypeRole.loadUser(
      transactionTypeRole.getRecipientUser(),
    )
    const accountLogic = new AccountLogic(signingAccount)
    await this.transactionBuilder.setCommunityFromUser(transactionDraft.user)
    const communityKeyPair = new KeyPair(this.transactionBuilder.getCommunity())

    const gradidoTransactionBuilder = await transactionTypeRole.getGradidoTransactionBuilder()
    const transaction = gradidoTransactionBuilder
      .setCreatedAt(new Date(transactionDraft.createdAt))
      .sign(accountLogic.calculateKeyPair(communityKeyPair).keyPair)
      .build()

    // build transaction entity
    this.transactionBuilder
      .fromGradidoTransaction(transaction)
      .setRecipientAccount(recipientAccount)
      .setSigningAccount(signingAccount)

    if (transactionTypeRole.isCrossGroupTransaction()) {
      await this.transactionBuilder.setOtherCommunityFromUser(transactionDraft.linkedUser)
    }
    return this
  }
}

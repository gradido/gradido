/* eslint-disable camelcase */
import { Account } from '@entity/Account'
import { GradidoTransactionBuilder } from 'gradido-blockchain-js'

import { UserRepository } from '@/data/User.repository'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { TransactionError } from '@/graphql/model/TransactionError'

export abstract class AbstractTransactionRole {
  // eslint-disable-next-line no-useless-constructor
  public constructor(protected self: TransactionDraft) {}

  abstract getSigningUser(): UserIdentifier
  abstract getRecipientUser(): UserIdentifier
  abstract getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder>

  public isCrossGroupTransaction(): boolean {
    return (
      this.self.user.communityUuid !== this.self.linkedUser.communityUuid &&
      this.self.linkedUser.communityUuid !== ''
    )
  }

  public async loadUser(user: UserIdentifier): Promise<Account> {
    const account = await UserRepository.findAccountByUserIdentifier(user)
    if (!account) {
      throw new TransactionError(
        TransactionErrorType.NOT_FOUND,
        "couldn't found user account in db",
      )
    }
    return account
  }
}

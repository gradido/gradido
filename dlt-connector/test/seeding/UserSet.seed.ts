import { Account } from '@entity/Account'
import { User } from '@entity/User'
import { v4 } from 'uuid'

import { AccountFactory } from '@/data/Account.factory'
import { KeyPair } from '@/data/KeyPair'
import { UserFactory } from '@/data/User.factory'
import { UserLogic } from '@/data/User.logic'
import { AccountType } from '@/graphql/enum/AccountType'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'

export type UserSet = {
  identifier: UserIdentifier
  user: User
  account: Account
}

export const createUserIdentifier = (userUuid: string, communityUuid: string): UserIdentifier => {
  const user = new UserIdentifier()
  user.uuid = userUuid
  user.communityUuid = communityUuid
  return user
}

export const createUserAndAccount = (
  userIdentifier: UserIdentifier,
  communityKeyPair: KeyPair,
): Account => {
  const accountDraft = new UserAccountDraft()
  accountDraft.user = userIdentifier
  accountDraft.createdAt = new Date().toISOString()
  accountDraft.accountType = AccountType.COMMUNITY_HUMAN
  const user = UserFactory.create(accountDraft, communityKeyPair)
  const userLogic = new UserLogic(user)
  const account = AccountFactory.createAccountFromUserAccountDraft(
    accountDraft,
    userLogic.calculateKeyPair(communityKeyPair),
  )
  account.user = user
  return account
}

export const createUserSet = (communityUuid: string, communityKeyPair: KeyPair): UserSet => {
  const identifier = createUserIdentifier(v4(), communityUuid)
  const account = createUserAndAccount(identifier, communityKeyPair)
  if (!account.user) {
    throw Error('user missing')
  }
  return {
    identifier,
    account,
    user: account.user,
  }
}

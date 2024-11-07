import { User } from '@entity/User'

import { AccountType } from '@/apis/dltConnector/enum/AccountType'

import { UserIdentifier } from './UserIdentifier'

export class UserAccountDraft {
  user: UserIdentifier
  createdAt: string
  accountType: AccountType

  constructor(user: User) {
    this.user = new UserIdentifier(user.gradidoID, user.communityUuid)
    this.createdAt = user.createdAt.toISOString()
    this.accountType = AccountType.COMMUNITY_HUMAN
  }
}

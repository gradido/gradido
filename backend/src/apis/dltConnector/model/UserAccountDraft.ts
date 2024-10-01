import { AccountType } from '@/apis/dltConnector/enum/AccountType'

import { UserIdentifier } from './UserIdentifier'

export interface UserAccountDraft {
  user: UserIdentifier
  createdAt: string
  accountType: AccountType
}

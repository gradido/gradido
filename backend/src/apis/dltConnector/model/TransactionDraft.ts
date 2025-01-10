// https://www.npmjs.com/package/@apollo/protobufjs
import { AccountType } from '@dltConnector/enum/AccountType'
import { TransactionType } from '@dltConnector/enum/TransactionType'

import { UserIdentifier } from './UserIdentifier'

export class TransactionDraft {
  user: UserIdentifier
  // not used for simply register address
  linkedUser?: UserIdentifier
  // not used for register address
  amount?: string
  memo?: string
  type: TransactionType
  createdAt: string
  // only for creation transaction
  targetDate?: string
  // only for deferred transaction
  timeoutDuration?: number
  // only for register address
  accountType?: AccountType
}

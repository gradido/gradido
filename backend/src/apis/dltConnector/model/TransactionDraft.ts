// https://www.npmjs.com/package/@apollo/protobufjs
import { AccountType } from '@dltConnector/enum/AccountType'
import { TransactionType } from '@dltConnector/enum/TransactionType'

import { AccountIdentifier } from './AccountIdentifier'

export class TransactionDraft {
  user: AccountIdentifier
  // not used for simply register address
  linkedUser?: AccountIdentifier
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

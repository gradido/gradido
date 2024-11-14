// https://www.npmjs.com/package/@apollo/protobufjs
import { TransactionLink } from '@entity/TransactionLink'

import { UserIdentifier } from './UserIdentifier'

export class TransactionLinkDraft {
  user: UserIdentifier
  seed: string
  amount: string
  createdAt: string
  timeoutDate: string

  constructor(transaction: TransactionLink) {
    this.amount = transaction.amount.abs().toString()
    const user = transaction.user
    this.user = new UserIdentifier(user.gradidoID, user.communityUuid)
    this.seed = transaction.code
    this.createdAt = transaction.createdAt.toISOString()
    this.timeoutDate = transaction.validUntil.toISOString()
  }
}

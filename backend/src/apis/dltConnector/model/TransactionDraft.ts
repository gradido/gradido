// https://www.npmjs.com/package/@apollo/protobufjs
import { Transaction } from '@entity/Transaction'

import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LogError } from '@/server/LogError'

import { UserIdentifier } from './UserIdentifier'

export class TransactionDraft {
  user: UserIdentifier
  linkedUser: UserIdentifier
  amount: string
  type: string
  createdAt: string
  // only for creation transactions
  targetDate?: string

  constructor(transaction: Transaction) {
    if (
      !transaction.linkedUserGradidoID ||
      !transaction.linkedUserCommunityUuid ||
      !transaction.userCommunityUuid
    ) {
      throw new LogError(
        `missing necessary field in transaction: ${transaction.id}, need linkedUserGradidoID, linkedUserCommunityUuid and userCommunityUuid`,
      )
    }
    this.user = new UserIdentifier(transaction.userGradidoID, transaction.userCommunityUuid)
    this.linkedUser = new UserIdentifier(
      transaction.linkedUserGradidoID,
      transaction.linkedUserCommunityUuid,
    )
    this.amount = transaction.amount.abs().toString()
    this.type = TransactionTypeId[transaction.typeId]
    this.createdAt = transaction.balanceDate.toISOString()
    this.targetDate = transaction.creationDate?.toISOString()
  }
}

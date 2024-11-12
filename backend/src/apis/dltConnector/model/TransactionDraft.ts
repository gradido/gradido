// https://www.npmjs.com/package/@apollo/protobufjs
import { Transaction } from '@entity/Transaction'
import { TransactionLink } from '@entity/TransactionLink'

import { TransactionTypeId } from '@/graphql/enum/TransactionTypeId'
import { LogError } from '@/server/LogError'

import { IdentifierSeed } from './IdentifierSeed'
import { UserIdentifier } from './UserIdentifier'

export class TransactionDraft {
  user: UserIdentifier
  linkedUser: UserIdentifier | IdentifierSeed
  amount: string
  type: string
  createdAt: string
  // only for creation transactions
  targetDate?: string
  // only for transaction links
  timeoutDate?: string

  constructor(transaction: Transaction | TransactionLink) {
    this.amount = transaction.amount.abs().toString()

    if (transaction instanceof Transaction) {
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
      this.createdAt = transaction.balanceDate.toISOString()
      this.targetDate = transaction.creationDate?.toISOString()
      this.type = TransactionTypeId[transaction.typeId]
    } else if (transaction instanceof TransactionLink) {
      const user = transaction.user
      this.user = new UserIdentifier(user.gradidoID, user.communityUuid)
      this.linkedUser = new IdentifierSeed(transaction.code)
      this.createdAt = transaction.createdAt.toISOString()
      this.type = TransactionTypeId[TransactionTypeId.LINK_SUMMARY]
      this.timeoutDate = transaction.validUntil.toISOString()
    }
  }
}

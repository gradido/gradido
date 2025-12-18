import * as v from 'valibot'
import { Context } from '../../Context'
import { adminUsers, contributionLinkModerators, loadContributionLinkTransactions } from '../../database'
import { CreatedUserDb, TransactionDb, transactionDbSchema } from '../../valibot.schema'
import { TransactionsSyncRole } from './TransactionsSync.role'

export class ContributionLinkTransactionSyncRole extends TransactionsSyncRole {
  constructor(readonly context: Context) {
    super(context)
  }
  itemTypeName(): string {
    return 'contributionLinkTransaction'
  }

  async loadFromDb(offset: number, count: number): Promise<TransactionDb[]> {
    const transactionUsers = await loadContributionLinkTransactions(this.context.db, offset, count)
    return transactionUsers.map((transactionUser) => {
      let linkedUser: CreatedUserDb | null | undefined = null
      linkedUser = contributionLinkModerators.get(transactionUser.contributionLinkId)
      if (linkedUser?.gradidoId === transactionUser.user.gradidoId) {
        for (const adminUser of adminUsers.values()) {
          if (adminUser.gradidoId !== transactionUser.user.gradidoId) {
            linkedUser = adminUser
            break
          }
        }
      }
      return v.parse(transactionDbSchema, {
        ...transactionUser.transaction,
        user: transactionUser.user,
        linkedUser,
      })
    })
  }
}

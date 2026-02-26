import { and, asc, eq, gt, isNotNull, or } from 'drizzle-orm'
import * as v from 'valibot'
import { Context } from '../../Context'
import { ContributionStatus } from '../../data/ContributionStatus'
import { contributionLinkModerators } from '../../database'
import { contributionsTable, usersTable } from '../../drizzle.schema'
import { DatabaseError } from '../../errors'
import { toMysqlDateTime } from '../../utils'
import { CreationTransactionDb, creationTransactionDbSchema } from '../../valibot.schema'
import { IndexType } from './AbstractSync.role'
import { CreationsSyncRole } from './CreationsSync.role'

export class ContributionLinkTransactionSyncRole extends CreationsSyncRole {
  constructor(readonly context: Context) {
    super(context)
  }
  itemTypeName(): string {
    return 'contributionLinkTransaction'
  }

  async loadFromDb(lastIndex: IndexType, count: number): Promise<CreationTransactionDb[]> {
    const result = await this.context.db
      .select({
        contribution: contributionsTable,
        user: usersTable,
      })
      .from(contributionsTable)
      .where(
        and(
          isNotNull(contributionsTable.contributionLinkId),
          eq(contributionsTable.contributionStatus, ContributionStatus.CONFIRMED),
          or(
            gt(contributionsTable.confirmedAt, toMysqlDateTime(lastIndex.date)),
            and(
              eq(contributionsTable.confirmedAt, toMysqlDateTime(lastIndex.date)),
              gt(contributionsTable.transactionId, lastIndex.id),
            ),
          ),
        ),
      )
      .innerJoin(usersTable, eq(contributionsTable.userId, usersTable.id))
      .orderBy(asc(contributionsTable.confirmedAt), asc(contributionsTable.transactionId))
      .limit(count)

    const verifiedCreationTransactions: CreationTransactionDb[] = []
    for (const row of result) {
      if (!row.contribution.contributionLinkId) {
        throw new Error(
          `expect contributionLinkId to be set: ${JSON.stringify(row.contribution, null, 2)}`,
        )
      }
      const item = {
        ...row.contribution,
        user: row.user,
        confirmedByUser: contributionLinkModerators.get(row.contribution.contributionLinkId),
      }
      if (!item.confirmedByUser || item.userId === item.confirmedByUser.id) {
        this.context.logger.warn(`skipped Contribution Link Transaction ${row.contribution.id}`)
        continue
      }
      try {
        verifiedCreationTransactions.push(v.parse(creationTransactionDbSchema, item))
      } catch (e) {
        throw new DatabaseError('load contributions with contribution link id', item, e as Error)
      }
    }
    return verifiedCreationTransactions
  }
}

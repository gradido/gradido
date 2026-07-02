import { and, asc, eq, gt, isNull, lte } from 'drizzle-orm'
import { IsNull, LessThanOrEqual, MoreThan } from 'typeorm'
import { drizzleDb } from '../AppDatabase'
import { TransactionLink as DbTransactionLink } from '../entity'
import { transactionLinksTable } from '../schemas'

export async function findTransactionLinkByCode(code: string): Promise<DbTransactionLink> {
  return await DbTransactionLink.findOneOrFail({
    where: { code },
    withDeleted: true,
  })
}

/**
 * Returns pending transaction links for a user, ordered by id (ascending)
 * @param userId - The user id
 * @param count - The number of transaction links to fetch
 * @param lastId - The id of the last transaction link to fetch (exclusive)
 * @param date - The date until which the transaction links are valid
 * @returns
 */
export async function transactionLinksPendingFromUserOrderByIdASC(
  userId: number,
  count: number,
  lastId: number = 0,
  date: Date = new Date(),
): Promise<DbTransactionLink[]> {
  const transactionLinks = await DbTransactionLink.find({
    where: {
      userId: userId,
      id: MoreThan(lastId),
      redeemedBy: IsNull(),
      validUntil: MoreThan(date),
      createdAt: LessThanOrEqual(date),
      deletedAt: IsNull(),
    },
    order: {
      id: 'ASC',
    },
    take: count,
  })
  return transactionLinks
}

/**
 * Returns pending transaction links for a user, ordered by id (ascending)
 * @param userId - The user id
 * @param count - The number of transaction links to fetch
 * @param lastId - The id of the last transaction link to fetch (exclusive)
 * @param date - The date until which the transaction links are valid
 * @returns
 */
export async function transactionLinksPendingFromUserOrderByIdASCDrizzle(
  userId: number,
  count: number,
  lastId: number = 0,
  date: Date = new Date(),
) {
  return await drizzleDb()
    .select({
      id: transactionLinksTable.id,
      amount: transactionLinksTable.amount,
      holdAvailableAmount: transactionLinksTable.holdAvailableAmount,
      createdAt: transactionLinksTable.createdAt,
    })
    .from(transactionLinksTable)
    .where(
      and(
        eq(transactionLinksTable.userId, userId),
        gt(transactionLinksTable.id, lastId),
        isNull(transactionLinksTable.redeemedBy),
        isNull(transactionLinksTable.deletedAt),
        gt(transactionLinksTable.validUntil, date),
        lte(transactionLinksTable.createdAt, date),
      ),
    )
    .orderBy(asc(transactionLinksTable.id))
    .limit(count)
}

export type transactionLinksBlockedAmounts = Awaited<
  ReturnType<typeof transactionLinksPendingFromUserOrderByIdASCDrizzle>
>[number]

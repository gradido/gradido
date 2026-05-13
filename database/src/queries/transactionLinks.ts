import { IsNull, LessThanOrEqual, MoreThan } from 'typeorm'
import { TransactionLink as DbTransactionLink } from '../entity'

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
    },
    order: {
      id: 'ASC',
    },
    take: count,
  })
  return transactionLinks
}

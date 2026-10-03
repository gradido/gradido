import { and, asc, eq, gt, isNull, lte } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { Order } from 'shared'
import { IsNull, LessThanOrEqual, MoreThan } from 'typeorm'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { TransactionLink as DbTransactionLink } from '../entity'
import {
  TransactionLinksSelect,
  transactionLinksTable,
  userContactsTable,
  usersTable,
} from '../schemas'

export async function findTransactionLinkByCode(code: string): Promise<DbTransactionLink> {
  return await DbTransactionLink.findOneOrFail({
    where: { code },
    withDeleted: true,
  })
}

// A deleted link redeems nothing - TypeORM left it out on its own (`@DeleteDateColumn`).
export async function dbFindTransactionLinkByCode(
  redeemCode: string,
): Promise<TransactionLinksSelect | null> {
  const rows = await drizzleDb()
    .select()
    .from(transactionLinksTable)
    .where(and(eq(transactionLinksTable.code, redeemCode), isNull(transactionLinksTable.deletedAt)))
  return rows[0] ? rows[0] : null
}

/**
 * A redeem link with what decides whether it can vouch for an account: what became of the
 * link, and where the account of the member who made it stands - their row and the address in
 * force for it (`users.email_id`).
 */
export type TransactionLinkWithOwner = Pick<
  TransactionLinksSelect,
  'userId' | 'validUntil' | 'redeemedAt' | 'redeemedBy' | 'deletedAt'
> & {
  ownerDeletedAt: Date | null
  ownerForeign: boolean
  ownerEmailChecked: boolean
}

/**
 * The link with this id as a {@link TransactionLinkWithOwner}, or null for a link without
 * such a member.
 *
 * Only columns this community writes itself: a link is made by a member signed in here, and
 * the confirmation of an address is this server's own. Read through the caller's transaction,
 * under the lock of that member's row. The rule that reads the columns stands in the backend
 * (`data/VouchingLink.logic.ts`), so this has no condition but the id.
 */
export async function dbFindTransactionLinkWithOwner(
  transactionLinkId: number,
  tx?: DrizzleTransaction | MySql2Database,
): Promise<TransactionLinkWithOwner | null> {
  if (!tx) {
    tx = drizzleDb()
  }
  const rows = await tx
    .select({
      userId: transactionLinksTable.userId,
      validUntil: transactionLinksTable.validUntil,
      redeemedAt: transactionLinksTable.redeemedAt,
      redeemedBy: transactionLinksTable.redeemedBy,
      deletedAt: transactionLinksTable.deletedAt,
      ownerDeletedAt: usersTable.deletedAt,
      ownerForeign: usersTable.foreign,
      ownerEmailChecked: userContactsTable.emailChecked,
    })
    .from(transactionLinksTable)
    .innerJoin(usersTable, eq(usersTable.id, transactionLinksTable.userId))
    .innerJoin(userContactsTable, eq(userContactsTable.id, usersTable.emailId))
    .where(eq(transactionLinksTable.id, transactionLinkId))
  return rows[0] ?? null
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
      id: Order.ASC,
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

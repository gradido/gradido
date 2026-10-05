import { and, asc, eq, gt, isNull, lte } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { Order } from 'shared'
import { IsNull, LessThanOrEqual, MoreThan } from 'typeorm'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { TransactionLink as DbTransactionLink } from '../entity'
import {
  ThankYouGreetingSelect,
  TransactionLinksSelect,
  thankYouGreetingPicturesTable,
  thankYouGreetingsTable,
  transactionLinksTable,
  UserSelect,
  userContactsTable,
  usersTable,
} from '../schemas'
import { ThankYouGreetingPictureInfo } from './thankYouGreetingPictures'

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
 * A redeem link with what the preview of it in a messenger is made from: what became of the
 * link, the member who made it, the greeting it carries - null for a plain link - and what is
 * known about that greeting's pictures without the pictures.
 */
export type TransactionLinkForPreview = {
  /** `code` as the row holds it, which need not be how it was asked for. */
  link: Pick<
    TransactionLinksSelect,
    'code' | 'userId' | 'validUntil' | 'redeemedAt' | 'redeemedBy' | 'deletedAt'
  >
  maker: Pick<UserSelect, 'alias' | 'gradidoId' | 'language' | 'deletedAt'>
  greeting: Pick<ThankYouGreetingSelect, 'motif'> | null
  pictures: ThankYouGreetingPictureInfo[]
}

/**
 * The link with this code as a {@link TransactionLinkForPreview}, or null: for a code no link
 * has, for a link whose maker has no row, and where more than one link carries the code -
 * `transaction_links.code` has no unique key, and of two links one may be open and the other
 * accepted.
 *
 * One statement, so that the state of the link, its maker, its greeting and its pictures are
 * of one moment: between two reads a thank-you can be accepted. It reads no picture, and
 * neither the amount, the memo, the greeting's line, whom the greeting is for nor a member's
 * real name.
 *
 * No condition on the link's state, a deleted link included: the rule that reads the columns
 * stands in the backend (`data/RedeemPreview.logic.ts`). Left joins all the way, which keeps
 * the link the first table read; `transaction_links` has no index on `code` and is read whole.
 *
 * Each joined part names its primary key first: Drizzle reads a part whose first column is
 * null as "no row", and `motif` is null for a greeting with a photo, `alias` for a member
 * without a username.
 */
export async function dbFindTransactionLinkForPreview(
  code: string,
): Promise<TransactionLinkForPreview | null> {
  const rows = await drizzleDb()
    .select({
      link: {
        id: transactionLinksTable.id,
        code: transactionLinksTable.code,
        userId: transactionLinksTable.userId,
        validUntil: transactionLinksTable.validUntil,
        redeemedAt: transactionLinksTable.redeemedAt,
        redeemedBy: transactionLinksTable.redeemedBy,
        deletedAt: transactionLinksTable.deletedAt,
      },
      maker: {
        id: usersTable.id,
        alias: usersTable.alias,
        gradidoId: usersTable.gradidoId,
        language: usersTable.language,
        deletedAt: usersTable.deletedAt,
      },
      greeting: {
        id: thankYouGreetingsTable.id,
        motif: thankYouGreetingsTable.motif,
      },
      picture: {
        id: thankYouGreetingPicturesTable.id,
        rendition: thankYouGreetingPicturesTable.rendition,
        width: thankYouGreetingPicturesTable.width,
        height: thankYouGreetingPicturesTable.height,
      },
    })
    .from(transactionLinksTable)
    .leftJoin(usersTable, eq(usersTable.id, transactionLinksTable.userId))
    .leftJoin(
      thankYouGreetingsTable,
      eq(thankYouGreetingsTable.transactionLinkCode, transactionLinksTable.code),
    )
    .leftJoin(
      thankYouGreetingPicturesTable,
      eq(thankYouGreetingPicturesTable.transactionLinkCode, transactionLinksTable.code),
    )
    .where(eq(transactionLinksTable.code, code))

  const first = rows[0]
  if (!first?.maker || rows.some((row) => row.link.id !== first.link.id)) {
    return null
  }
  const { id: _linkId, ...link } = first.link
  const { id: _makerId, ...maker } = first.maker
  return {
    link,
    maker,
    greeting: first.greeting ? { motif: first.greeting.motif } : null,
    pictures: rows.flatMap((row) => (row.picture ? [row.picture] : [])),
  }
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

import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { GradidoUnit, isAliasEraName, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { Transaction as DbTransaction } from '../entity'
import { TransactionTypeId } from '../enum'
import { DBNotFoundError } from '../errorTypes'
import { transactionsTable, usersTable } from '../schemas'

export const getLastTransaction = async (
  userId: number,
  relations?: string[],
): Promise<DbTransaction | null> => {
  return DbTransaction.findOne({
    where: { userId },
    order: { balanceDate: 'DESC', id: 'DESC' },
    relations,
  })
}

const TransactionNotFound = (where: string) => new DBNotFoundError('transactions', where)

export async function dbUpdateBalanceAndDate(txPart: {
  id: number
  balance: GradidoUnit
  balanceDate: Date
}): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(transactionsTable)
    .set({
      balance: txPart.balance,
      balanceDate: txPart.balanceDate,
    })
    .where(eq(transactionsTable.id, txPart.id))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return {
    success: false,
    error: TransactionNotFound(`id = ${txPart.id}`),
  }
}

/**
 * One counterparty of a member's bookings, as the contact list shows it.
 *
 * Two kinds of row come out of the same query, told apart by `linkedUserId`:
 *
 *   - a member of THIS community: `linkedUserId` is set, and `communityUuid`, `gradidoId`,
 *     `alias` and `deletedAt` come from their `users` row (joined, so a renamed member
 *     shows their current alias and an old booking without the uuid pair still resolves);
 *   - a member of ANOTHER community: `linkedUserId` is null, the pair comes from the
 *     booking itself and `alias` is the name the NEWEST booking with them carried --
 *     which is all this community ever learns about them, unless the federation stored a
 *     `users` row with `foreign = 1`, which the caller looks up by the pair.
 *
 * ⚠️ `alias` for a foreign contact is null unless the stored `linked_user_name` has the
 * shape of an alias (`isAliasEraName`): before the alias era that column held an assembled
 * real name, and NU-019 forbids that name to reach a member by any path -- shown OR
 * searched. The guard sits here, before `search` runs over the rows, so that the search can
 * never confirm a name the row would not show. The resolver applies the same rule once
 * more when it builds the model (isAliasEraName); that is a second lock, not the first.
 */
export interface ContactRow {
  linkedUserId: number | null
  communityUuid: string | null
  gradidoId: string
  alias: string | null
  deletedAt: Date | null
  firstAt: Date
  lastAt: Date
  bookings: number
}

export interface ContactsPage {
  contacts: ContactRow[]
  /** The number of PEOPLE this member has exchanged Gradido with, not of bookings. */
  count: number
}

/** The two booking kinds that have a counterparty. A creation is booked with nobody. */
const COUNTERPARTY_TYPES = [TransactionTypeId.SEND, TransactionTypeId.RECEIVE]

const asDate = (value: unknown): Date => (value instanceof Date ? value : new Date(String(value)))

/**
 * The stored name of a foreign counterparty, or null when it cannot be an alias -- the one
 * rule that keeps a pre-alias-era "First Last" out of the list AND out of the search.
 *
 * `isAliasEraName` comes from `shared` because the backend applies the very same rule when
 * it fills `User.alias` (see counterparty.ts). Two copies of it would be two locks that can
 * drift apart, and the drift would silently reopen the search oracle this guard closes.
 */
const aliasOrNull = (stored: unknown): string | null => {
  if (stored === null || stored === undefined) {
    return null
  }
  const name = String(stored)
  return isAliasEraName(name) ? name : null
}

/**
 * Everyone this member has ever exchanged Gradido with -- each person once, newest contact
 * first, with the dates of the first and the latest booking and how many there were.
 *
 * A grouping over `transactions`, not a table of its own: the counterparty already sits on
 * every SEND and RECEIVE row (four columns, written by executeTransaction), so the list is
 * a VIEW on the bookings and needs neither a migration nor a second truth.
 *
 * ★ Two groupings, one list. A member of this community is grouped by `linked_user_id`
 * (old rows may lack the uuid pair; grouping by the pair would split one person into
 * two contacts), a member of another community by the pair. The two are joined in
 * memory, which is also where search and paging happen: the whole grouped set is a few
 * hundred small rows for the busiest account (713 counterparties measured), and doing it
 * here keeps the two branches out of a UNION with GROUP BY on each side.
 *
 * `search` matches the alias, case-insensitively, anywhere in it -- the guarded alias, so a
 * foreign contact whose stored name is not alias-shaped matches nothing (see ContactRow).
 */
export async function dbSelectContactsByUserId(
  userId: number,
  options: { search?: string; limit: number; offset: number },
): Promise<ContactsPage> {
  const db = drizzleDb()
  const withCounterparty = and(
    eq(transactionsTable.userId, userId),
    inArray(transactionsTable.typeId, COUNTERPARTY_TYPES),
  )

  const local = await db
    .select({
      linkedUserId: transactionsTable.linkedUserId,
      communityUuid: usersTable.communityUuid,
      gradidoId: usersTable.gradidoId,
      alias: usersTable.alias,
      deletedAt: usersTable.deletedAt,
      firstAt: sql`min(${transactionsTable.balanceDate})`.mapWith(asDate),
      lastAt: sql`max(${transactionsTable.balanceDate})`.mapWith(asDate),
      bookings: sql`count(*)`.mapWith(Number),
    })
    .from(transactionsTable)
    .innerJoin(usersTable, eq(usersTable.id, transactionsTable.linkedUserId))
    .where(and(withCounterparty, isNotNull(transactionsTable.linkedUserId)))
    .groupBy(
      transactionsTable.linkedUserId,
      usersTable.communityUuid,
      usersTable.gradidoId,
      usersTable.alias,
      usersTable.deletedAt,
    )

  // The name off the NEWEST booking of the group: group_concat ordered by date, first
  // element. A newline as the separator, because neither an alias nor an assembled name
  // can contain one, and MySQL's \n escape is a literal here, not a bound parameter.
  const remote = await db
    .select({
      communityUuid: transactionsTable.linkedUserCommunityUuid,
      gradidoId: transactionsTable.linkedUserGradidoId,
      alias: sql`substring_index(group_concat(${transactionsTable.linkedUserName} order by ${transactionsTable.balanceDate} desc separator '\n'), '\n', 1)`,
      firstAt: sql`min(${transactionsTable.balanceDate})`.mapWith(asDate),
      lastAt: sql`max(${transactionsTable.balanceDate})`.mapWith(asDate),
      bookings: sql`count(*)`.mapWith(Number),
    })
    .from(transactionsTable)
    .where(
      and(
        withCounterparty,
        isNull(transactionsTable.linkedUserId),
        isNotNull(transactionsTable.linkedUserGradidoId),
      ),
    )
    .groupBy(transactionsTable.linkedUserCommunityUuid, transactionsTable.linkedUserGradidoId)

  const rows: ContactRow[] = [
    ...local.map((row) => ({
      linkedUserId: row.linkedUserId,
      communityUuid: row.communityUuid,
      gradidoId: row.gradidoId,
      alias: row.alias,
      deletedAt: row.deletedAt,
      firstAt: row.firstAt,
      lastAt: row.lastAt,
      bookings: row.bookings,
    })),
    ...remote.map((row) => ({
      linkedUserId: null,
      communityUuid: row.communityUuid,
      // Guarded by the where clause; the type of the column is what makes this nullable.
      gradidoId: row.gradidoId as string,
      alias: aliasOrNull(row.alias),
      deletedAt: null,
      firstAt: row.firstAt,
      lastAt: row.lastAt,
      bookings: row.bookings,
    })),
  ]

  const needle = options.search?.trim().toLowerCase()
  const matching = needle
    ? rows.filter((row) => (row.alias ?? '').toLowerCase().includes(needle))
    : rows
  matching.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())

  return {
    contacts: matching.slice(options.offset, options.offset + options.limit),
    count: matching.length,
  }
}

import { and, eq, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm'
import { GradidoUnit, isAliasEraName, VoidResult } from 'shared'
import { FindOptionsWhere, In, IsNull } from 'typeorm'
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

/**
 * The two booking kinds that have a counterparty. A creation is booked with nobody -- and
 * yet carries the confirming moderator's id in `linked_user_id` (ContributionResolver), which
 * is why every list that names a counterparty restricts the type with this constant.
 */
const COUNTERPARTY_TYPES = [TransactionTypeId.SEND, TransactionTypeId.RECEIVE]

/**
 * Who a booking list is narrowed to: ONE other member, in the two forms a booking can carry
 * them. They are the same two forms `dbSelectContactsByUserId` groups the contact list by,
 * with the same type restriction, so the number in the contact window and the list its link
 * opens are counted by one rule.
 *
 * ⚠️ One rule, spelled twice for now: the contact list is Drizzle, the paged list below is
 * still TypeORM (AGENTS.md step 1, moved and not yet translated). They share the type
 * constant and ContactResolver.test holds them against each other; step 2 -- translating
 * `dbSelectTransactionsByUserId` -- is where the two spellings become one predicate.
 */
export interface BookingCounterparty {
  /**
   * The `users` row carrying the pair, or null when there is none. A member of this
   * community always has one; a member of another community only where the federation
   * stored one. Resolved by the caller through `dbFindUserIdByUuids` -- a users query,
   * which belongs in queries/user.ts, not here.
   */
  localUserId: number | null
  gradidoId: string
  communityUuid: string
}

/**
 * The `where` of one member's booking list, narrowed to one counterparty where one is given.
 *
 * ⛔ `userId` stands in EVERY branch. An array is OR to TypeORM, so a branch without it
 * selects other members' bookings with that counterparty -- a leak that looks perfectly
 * right to whoever tries the filter on their own account. Every branch is therefore built
 * from one `own` object, and transactions.test.ts measures the property from the other
 * side: bob, narrowed to somebody only bibi booked with, sees nothing.
 *
 * No branch for a counterparty without a `users` row that would match by id: it is simply
 * left out, which is the closed answer. (`In([])` would also close, `{ linkedUserId:
 * undefined }` would silently open -- TypeORM reads an undefined property as no condition.)
 */
export const bookingsWhere = (
  userId: number,
  counterparty?: BookingCounterparty,
): FindOptionsWhere<DbTransaction> | FindOptionsWhere<DbTransaction>[] => {
  if (!counterparty) {
    return { userId }
  }
  // Every branch starts from this, and this is the one place the ⛔ above is enforced.
  const own = { userId, typeId: In(COUNTERPARTY_TYPES) }
  const where: FindOptionsWhere<DbTransaction>[] = [
    // Booked with a member of another community who has no row here: the pair sits on the
    // booking itself.
    {
      ...own,
      linkedUserId: IsNull(),
      linkedUserGradidoID: counterparty.gradidoId,
      linkedUserCommunityUuid: counterparty.communityUuid,
    },
  ]
  if (counterparty.localUserId !== null) {
    // Booked with a member who has a `users` row: the booking points at it by id. The id
    // decides rather than the pair, because an old booking may carry no pair at all -- the
    // reason the contact list groups these by `linked_user_id` too.
    where.push({ ...own, linkedUserId: counterparty.localUserId })
  }
  return where
}

/**
 * Whether one grouped contact IS the counterparty asked about -- the same two branches
 * `bookingsWhere` selects bookings by, in the grouped domain, and deliberately next to it.
 *
 * ⛔ The two rules must stay one rule. The contact window states a number ("51 bookings")
 * and the link under that number opens the booking list narrowed by `bookingsWhere`. A
 * contact matched here by a rule the booking filter does not share would put a count over
 * a list of a different length, and nothing on either screen would say which was wrong.
 *
 * A local contact is matched by the `users` row, never by the pair: the grouping keys
 * those rows by `linked_user_id` for the reason `bookingsWhere` gives -- an old booking may
 * carry no pair at all. Where the asked-about pair resolved to no row (`localUserId` null),
 * no local contact can match, which is the closed answer and the same one the where clause
 * gives by leaving its id branch out.
 */
const isContactCounterparty = (row: ContactRow, counterparty: BookingCounterparty): boolean =>
  row.linkedUserId !== null
    ? row.linkedUserId === counterparty.localUserId
    : row.gradidoId === counterparty.gradidoId && row.communityUuid === counterparty.communityUuid

/**
 * One member's bookings, one page at a time, with the row before each one (which feeds
 * `previousBalance`) -- the whole account, or only the bookings shared with `counterparty`.
 *
 * Moved here from `backend/src/graphql/resolver/util/getTransactionList.ts` -- step one of
 * the query migration AGENTS.md describes, and step one only: still TypeORM, same options,
 * same result. Renamed for the `db…` rule because this delivery touched it (the way
 * `dbGetUserById` was); `getLastTransaction` above is untouched and keeps its name. The
 * order argument is a plain string union rather than the backend's `Order` enum, which
 * this package cannot import; the enum's values are these two strings.
 */
export const dbSelectTransactionsByUserId = async (
  userId: number,
  limit: number,
  offset: number,
  order: 'ASC' | 'DESC',
  counterparty?: BookingCounterparty,
): Promise<[DbTransaction[], number]> => {
  return DbTransaction.findAndCount({
    where: bookingsWhere(userId, counterparty),
    order: { balanceDate: order, id: order },
    relations: ['previousTransaction'],
    skip: offset,
    take: limit,
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

const asDate = (value: unknown): Date => (value instanceof Date ? value : new Date(String(value)))

/** One contact as one string, for an order that does not depend on the storage engine. */
const contactKey = (row: { communityUuid: string | null; gradidoId: string }): string =>
  `${row.communityUuid ?? ''}/${row.gradidoId}`

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
 *
 * `counterparty` narrows the whole thing to ONE person, by the rule `isContactCounterparty`
 * holds -- the lookup behind the contact window when it is opened from a booking row rather
 * than from the contact list. `count` is then 0 or 1.
 *
 * `order` is over `lastAt`, newest first unless asked otherwise -- the direction the API
 * offers through the house `Paginated` arguments. A plain string union rather than the
 * backend's `Order` enum, which this package cannot import.
 */
export async function dbSelectContactsByUserId(
  userId: number,
  options: {
    search?: string
    counterparty?: BookingCounterparty
    limit: number
    offset: number
    order?: 'ASC' | 'DESC'
  },
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
        // Not null AND not empty: the booking list tests the same column for truthiness
        // and skips a row without an id (TransactionResolver), so a row carrying '' must
        // not reach the contact list either -- there it would name nobody, and the
        // counterparty helper refuses it as the programmer error it would be.
        ne(transactionsTable.linkedUserGradidoId, ''),
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

  // One member rather than the page: what the wallet asks when a booking row is tapped and
  // the window over it has to state the same figures the contact list states. Narrowed
  // before the search, which then has one row to look at -- the two are independent.
  const { counterparty } = options
  const narrowed = counterparty
    ? rows.filter((row) => isContactCounterparty(row, counterparty))
    : rows

  const needle = options.search?.trim().toLowerCase()
  const matching = needle
    ? narrowed.filter((row) => (row.alias ?? '').toLowerCase().includes(needle))
    : narrowed
  // ⛔ The pair breaks a tie on the date. Two contacts can share a balance_date, the two
  // groupings come back in whatever order the engine chose, and every page is a SEPARATE
  // request -- so without this a tied contact can appear on two pages, or on none.
  //
  // Plain string comparison, not localeCompare, whose order depends on the platform's
  // locale data: two requests served by two processes would then page under two rules.
  // The direction applies to the tie-break as well, so the reversed list is the exact
  // reverse of the default one.
  const direction = options.order === 'ASC' ? 1 : -1
  matching.sort((a, b) => {
    const byDate = a.lastAt.getTime() - b.lastAt.getTime()
    if (byDate !== 0) {
      return direction * byDate
    }
    const keyA = contactKey(a)
    const keyB = contactKey(b)
    return direction * (keyA < keyB ? -1 : keyA > keyB ? 1 : 0)
  })

  return {
    contacts: matching.slice(options.offset, options.offset + options.limit),
    count: matching.length,
  }
}

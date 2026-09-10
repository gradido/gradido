import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm'
import { alias as aliasedTable } from 'drizzle-orm/mysql-core'
import { GradidoUnit, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import { transactionsTable, usersTable } from '../schemas/drizzle.schema'
import { dbAliasHeldByOther } from './userAliases'

// Drizzle only. The `users` queries still on TypeORM live in `./user.typeorm` until they
// are translated.
//
// Wherever TypeORM read `users` as its main table it added `deleted_at IS NULL` on its own
// (the entity has a `@DeleteDateColumn`); Drizzle adds nothing, so the translations below
// spell that condition out.

/**
 * The id of the `users` row carrying this pair, or null when there is none.
 *
 * For narrowing a booking list to one counterparty (queries/transactions.ts): the pair is
 * what the contact window carries, and `uuid_key` makes it unique in `users` (migration
 * 0073), so this is one row or none -- never a list to unite. No `foreign` condition: the
 * federation stores members of other communities as rows too, and the contact list joins
 * `linked_user_id` without asking. No `deletedAt` condition either: a booking keeps naming
 * a member whose account is gone, so their bookings stay filterable.
 *
 * `homeCommunityUuid`: when the pair names THIS community, a `foreign = 0` row that still
 * carries no community uuid counts as well. Migration 0129 filled those rows, but it was a
 * no-op wherever the home community had no row yet when it ran -- and the contact list
 * stands in the home uuid for exactly these members (ContactResolver), so the pair it
 * hands out has to find them here too, or the window would count bookings the list then
 * cannot show.
 */
export async function dbFindUserIdByUuids(
  communityUuid: string,
  gradidoID: string,
  options: { homeCommunityUuid?: string | null } = {},
): Promise<number | null> {
  const exactPair = and(
    eq(usersTable.communityUuid, communityUuid),
    eq(usersTable.gradidoId, gradidoID),
  )
  const where =
    options.homeCommunityUuid && options.homeCommunityUuid === communityUuid
      ? or(
          exactPair,
          and(
            eq(usersTable.foreign, 0),
            isNull(usersTable.communityUuid),
            eq(usersTable.gradidoId, gradidoID),
          ),
        )
      : exactPair
  const rows = await drizzleDb()
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(where)
    .limit(1)
  return rows[0]?.id ?? null
}

/**
 * Forget that the GMS holds a copy of this member - because it has just been removed.
 *
 * Nothing else ever clears this flag: it is only ever set, by the run that publishes a
 * member. A member who withdrew their consent would therefore keep counting as
 * registered, and the paths that re-register a member before publishing anything of
 * theirs would skip that step and write against a member the GMS no longer knows.
 */
export async function dbClearGmsRegistration(userId: number): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .update(usersTable)
    .set({ gmsRegistered: 0, gmsRegisteredAt: null })
    .where(eq(usersTable.id, userId))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: new DBNotFoundError('users', `id = ${userId}`) }
}

export async function aliasExists(alias: string, userId?: number): Promise<boolean> {
  // Only local users count. Aliases are unique per community, not globally: migration
  // 0073 dropped the global UNIQUE on users.alias in favour of UNIQUE(alias, community_uuid).
  // Rows with foreign = 1 are cached copies of members of other communities, so an alias
  // held there must not block a member of this one.
  const [user] = await drizzleDb()
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(eq(usersTable.alias, alias), eq(usersTable.foreign, 0), isNull(usersTable.deletedAt)),
    )
    .limit(1)
  if (user !== undefined && (userId === undefined || user.id !== userId)) {
    return true
  }
  // A name somebody left behind stays theirs, so it stays blocked - except for its own
  // owner, who may take it back.
  return dbAliasHeldByOther(alias, userId)
}

/**
 * The REAL names of the moderators behind a contribution -- who changed it, who moderated
 * it, who closed it. Its one caller is the admin contribution list.
 *
 * ⛔ The real name here is a decision, not an oversight, and it survived the round that
 * took real names out of everything a third party reads (NU-021/KLAR-09). This column is
 * not read by a member about another member; it is read by a moderator about a colleague,
 * and somebody who declined a contribution has to be a person the next moderator can go
 * and ask. An alias would cost exactly that, and for colleagues without one it would put
 * a 36-character identifier in a 500-row table. (Bernd, 26.08.2026.)
 *
 * So: if a later round is tempted to "fix" this the way the mails were fixed -- it was
 * looked at, and this is the answer. What must not happen is the reverse: this function
 * must not grow a second caller that shows the result to MEMBERS. Everything on that side
 * goes through `publicAlias` in `shared`.
 */
export async function findUserNamesByIds(userIds: number[]): Promise<Map<number, string>> {
  const users = await drizzleDb()
    // No `alias`: it was selected and never read, which made this function look like it
    // was about to hand one out.
    .select({ id: usersTable.id, firstName: usersTable.firstName, lastName: usersTable.lastName })
    .from(usersTable)
    .where(and(inArray(usersTable.id, userIds), isNull(usersTable.deletedAt)))
  return new Map(
    users.map((user) => {
      return [user.id, `${user.firstName} ${user.lastName}`]
    }),
  )
}

/**
 * The ids of all local members who allow the GMS to hold a copy of them and whose account
 * is not deleted. Moved from `backend/src/apis/gms/ExportUsers.ts`.
 */
export async function dbFindGmsAllowedLocalUserIds(): Promise<{ id: number }[]> {
  return drizzleDb()
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(eq(usersTable.foreign, 0), eq(usersTable.gmsAllowed, 1), isNull(usersTable.deletedAt)),
    )
}

/**
 * The latest balance of every member who has one - one row per member, from their most
 * recent booking. Moved from `backend/src/graphql/resolver/StatisticsResolver.ts`.
 *
 * "Most recent" is `getLastTransaction`'s rule: latest `balance_date`, and of those the
 * highest id. The TypeORM version matched `balance_date = MAX(balance_date)` instead, so a
 * member with two bookings at the same moment came back twice - counted twice as active and
 * with both balances in the sums. Production had one such member.
 */
export async function dbSelectLatestUserBalances(): Promise<
  { balance: GradidoUnit | null; balanceDate: Date }[]
> {
  const latest = aliasedTable(transactionsTable, 't')
  return drizzleDb()
    .select({
      balance: transactionsTable.balance,
      balanceDate: transactionsTable.balanceDate,
    })
    .from(usersTable)
    .innerJoin(transactionsTable, eq(usersTable.id, transactionsTable.userId))
    .where(
      and(
        eq(
          transactionsTable.id,
          drizzleDb()
            .select({ id: latest.id })
            .from(latest)
            .where(eq(latest.userId, usersTable.id))
            .orderBy(desc(latest.balanceDate), desc(latest.id))
            .limit(1),
        ),
        isNull(usersTable.deletedAt),
      ),
    )
    .orderBy(desc(transactionsTable.balanceDate), desc(transactionsTable.id))
}

/**
 * Mark these members as published to the GMS, now. Moved from `batchUpdateGmsStatus` in
 * `backend/src/graphql/resolver/util/sendUserToGms.ts`; `dbClearGmsRegistration` above is
 * its counterpart.
 */
export async function dbMarkUsersGmsRegistered(userIds: number[]): Promise<void> {
  await drizzleDb()
    .update(usersTable)
    .set({ gmsRegistered: 1, gmsRegisteredAt: new Date() })
    .where(inArray(usersTable.id, userIds))
}

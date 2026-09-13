import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm'
import { alias as aliasedTable } from 'drizzle-orm/mysql-core'
import { GradidoUnit, PasswordEncryptionType, Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBDuplicateEntryError, DBNotFoundError } from '../errorTypes'
import {
  transactionsTable,
  UserContactSelect,
  UserInsert,
  UserRoleSelect,
  UserSelect,
  userAvatarsTable,
  userContactsTable,
  userRolesTable,
  usersTable,
} from '../schemas/drizzle.schema'
import { dbAliasHeldByOther } from './userAliases'

// Drizzle only. The `users` queries still on TypeORM live in `./user.typeorm` until they
// are translated.
//
// Wherever TypeORM read `users` as its main table it added `deleted_at IS NULL` on its own
// (the entity has a `@DeleteDateColumn`); Drizzle adds nothing, so the translations below
// spell that condition out.

/**
 * Everything the login needs about the member signing in, in one round trip.
 *
 * "In one round trip" is the reason this query exists rather than four. The login is the
 * one request path every member and every test takes, and it used to walk it four times
 * over: the user row, the role, the contact, and the avatar each on their own. The joins
 * below are cheap -- one row by a unique address, 0..1 role, 0..1 avatar -- and the
 * picture rides along so the wallet can show a member their own face on the first screen
 * instead of initials until some later query happens to refill it.
 *
 * ⛔ Deleted accounts INCLUDED, deliberately, and this one must not grow a
 * `deleted_at IS NULL`. The caller answers a deleted account exactly like an unknown
 * address (CWE-203: the answer must not confirm that an account exists), but it still has
 * to KNOW which of the two it met -- to log it as what it is. Everything the caller must
 * refuse -- deletion, an unconfirmed address, a missing password -- is checked there, on
 * the row this hands back.
 *
 * The address is matched on `user_contacts`, not on `users`: `users.email_id` names the
 * address that is IN FORCE, so someone who changed their address signs in with the new
 * one and not with an old row that still carries their name.
 *
 * A second `user_roles` row for the same member is refused rather than resolved. The
 * application allows 0 or 1 (see the table's own note), so a second one is a broken row,
 * and picking the first would make who is an admin depend on insertion order.
 */
export async function dbFindUserLoginByEmail(
  email: string,
): Promise<Result<DbLoginUser, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select({
      user: usersTable,
      role: userRolesTable,
      emailContact: userContactsTable,
      avatar: userAvatarsTable.avatarSmall,
    })
    .from(usersTable)
    // 0..1 per member by the application's rule, 0..n by the table's -- see below.
    .leftJoin(userRolesTable, eq(usersTable.id, userRolesTable.userId))
    .innerJoin(userContactsTable, eq(usersTable.emailId, userContactsTable.id))
    // 0..1 by shape: user_avatars is keyed by user_id.
    .leftJoin(userAvatarsTable, eq(usersTable.id, userAvatarsTable.userId))
    .where(eq(userContactsTable.email, email))

  if (!rows.length) {
    return { success: false, error: new DBNotFoundError('user_contacts', `email: ${email}`) }
  }
  if (rows.length > 1) {
    throw new DBDuplicateEntryError(
      'user_contacts join user_roles join users join user_avatars',
      'email',
      email,
    )
  }
  const item = rows[0]
  return {
    success: true,
    value: { ...item.user, role: item.role, emailContact: item.emailContact, avatar: item.avatar },
  }
}

/**
 * A `users` row together with the address in force for it -- the shape almost everything
 * above the database means when it says "the user". The TypeORM entity carries the same
 * pair as `User` + `User.emailContact`, which is why the consumers of both take
 * `DbUser | User` while the translation is under way.
 *
 * ⚠️ The two spell the id differently: the entity has `gradidoID`, the row `gradidoId`.
 * Whoever accepts both reads it through `gradidoIdOf` rather than picking one.
 */
export type DbUser = UserSelect & {
  emailContact: UserContactSelect
}

/** What {@link dbFindUserLoginByEmail} hands back: a {@link DbUser} plus the two things
 * the login answer needs and the row cannot carry -- the member's role and the small
 * rendition of their picture. Both null where there is none. */
export type DbLoginUser = DbUser & {
  role: UserRoleSelect | null
  avatar: Buffer | null
}

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
 * The exact pair and nothing else. This used to take the home community's uuid as well and
 * let a local row WITHOUT a uuid count for it -- the state migration 0129 could leave
 * behind. Migration 0133 made `users.community_uuid` NOT NULL, so that row cannot exist.
 */
export async function dbFindUserIdByUuids(
  communityUuid: string,
  gradidoID: string,
): Promise<number | null> {
  const rows = await drizzleDb()
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.communityUuid, communityUuid), eq(usersTable.gradidoId, gradidoID)))
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
    .set({ gmsRegistered: false, gmsRegisteredAt: null })
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
      and(eq(usersTable.alias, alias), eq(usersTable.foreign, false), isNull(usersTable.deletedAt)),
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
      and(
        eq(usersTable.foreign, false),
        eq(usersTable.gmsAllowed, true),
        isNull(usersTable.deletedAt),
      ),
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
    .set({ gmsRegistered: true, gmsRegisteredAt: new Date() })
    .where(inArray(usersTable.id, userIds))
}

/**
 * Store a freshly derived password together with the scheme it was derived under.
 *
 * The two always travel together, and that is the whole reason this is one function
 * rather than two calls to `dbUserUpdateField` below: the hash means nothing without the
 * salt rule that produced it, so a row that carries the new hash under the old scheme can
 * no longer be signed in to. The login writes here when it meets an account still on the
 * EMAIL scheme and has just verified the password, so it can rewrite it under
 * GRADIDO_ID -- which is why the salt must not change under a hash already written.
 *
 * No `deleted_at` condition and no report of what was matched: the caller has the row in
 * hand, having just read and checked it.
 */
export async function dbUserUpdatePassword(
  userId: number,
  passwordEncryptionType: PasswordEncryptionType,
  password: bigint,
): Promise<void> {
  await drizzleDb()
    .update(usersTable)
    .set({ password, passwordEncryptionType })
    .where(eq(usersTable.id, userId))
}

/**
 * One column of one `users` row, by name.
 *
 * For the single-field writes that used to be `dbUser.field = x; await dbUser.save()` --
 * which sent the WHOLE row back, every column of it, and so could carry along anything
 * another request had changed in between. Named columns only: `K extends keyof UserInsert`
 * makes a typo a compile error and gives the value the column's own type.
 *
 * Deliberately not a general-purpose updater. Two fields that only make sense together
 * belong in a function of their own, the way the password above does; whoever reaches for
 * two calls of this in a row should write that function instead.
 */
export async function dbUserUpdateField<K extends keyof UserInsert>(
  userId: number,
  field: K,
  value: UserInsert[K],
): Promise<void> {
  await drizzleDb()
    .update(usersTable)
    .set({
      [field]: value,
    })
    .where(eq(usersTable.id, userId))
}

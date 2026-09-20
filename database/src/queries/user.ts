import { and, desc, eq, inArray, isNull, ne, or } from 'drizzle-orm'
import { type AnyMySqlColumn, alias as aliasedTable } from 'drizzle-orm/mysql-core'
import {
  ContactOrigin,
  GradidoUnit,
  PasswordEncryptionType,
  publicAlias,
  Result,
  VoidResult,
} from 'shared'
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
 * Every join is 0..1 by shape: the address by `user_contacts.email` (UNIQUE), the role by
 * `user_roles.user_id` (UNIQUE since migration 0135), the picture by `user_avatars.user_id`
 * (primary key). More than one row can only mean two `users` rows naming the same address
 * row through `email_id` -- a broken state, refused rather than resolved, because picking
 * one would sign somebody in as whichever member the database reached first.
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
    // 0..1 by shape: user_roles.user_id is UNIQUE (migration 0135).
    .leftJoin(userRolesTable, eq(usersTable.id, userRolesTable.userId))
    .innerJoin(userContactsTable, eq(usersTable.emailId, userContactsTable.id))
    // 0..1 by shape: user_avatars is keyed by user_id.
    .leftJoin(userAvatarsTable, eq(usersTable.id, userAvatarsTable.userId))
    .where(eq(userContactsTable.email, email))

  if (!rows.length) {
    return { success: false, error: new DBNotFoundError('user_contacts', `email: ${email}`) }
  }
  if (rows.length > 1) {
    throw new DBDuplicateEntryError('users by email_id', 'email', email)
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
 * behind. Migration 0134 made `users.community_uuid` NOT NULL, so that row cannot exist.
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
        ne(usersTable.gmsPublishLocation, 2), // GMS_LOCATION_TYPE_RANDOM = 2 but enum is defined in backend, so I cannot access
      ),
    )
}

/**
 * The members of one other community that this community holds a `users` row for -- the rows
 * the federation stores for the counterparty of a transfer (`foreign = 1`, core and federation
 * `storeForeignUser`). What the refresh of picture dates asks that community about (AS-019,
 * backend refreshForeignMemberAvatarDates).
 *
 * Only `foreign = 1`: this community's own members carry the home community's uuid, and their
 * dates come from their own pictures, never from another community.
 *
 * Ordered by id, so the blocks the caller cuts are the same from one run to the next.
 */
export async function dbSelectForeignMemberGradidoIds(communityUuid: string): Promise<string[]> {
  const rows = await drizzleDb()
    .select({ gradidoId: usersTable.gradidoId })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.foreign, true),
        eq(usersTable.communityUuid, communityUuid),
        isNull(usersTable.deletedAt),
      ),
    )
    .orderBy(usersTable.id)
  return rows.map((row) => row.gradidoId)
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
 * The `users` columns that must never be written one at a time: each only means something
 * together with the other. A hash stored without its scheme -- or a scheme changed under a
 * stored hash -- leaves an account nobody can sign in to. Written through
 * dbUserUpdatePassword, and only there.
 */
type UserCoupledColumn = 'password' | 'passwordEncryptionType'

/** Every `users` column dbUserUpdateField may write on its own. */
export type UserSingleColumn = Exclude<keyof UserInsert, UserCoupledColumn>

/**
 * One column of one `users` row, by name.
 *
 * For the single-field writes that used to be `dbUser.field = x; await dbUser.save()` --
 * which sent the WHOLE row back, every column of it, and so could carry along anything
 * another request had changed in between. Named columns only: `K extends UserSingleColumn`
 * makes a typo a compile error and gives the value the column's own type.
 *
 * ⛔ Not the password columns: `UserSingleColumn` leaves them out, so
 * `dbUserUpdateField(id, 'password', …)` does not compile. Two fields that only make sense
 * together belong in a function of their own, the way dbUserUpdatePassword is one; whoever
 * reaches for two calls of this in a row should write that function instead.
 */
export async function dbUserUpdateField<K extends UserSingleColumn>(
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

/** The `users` columns the trace conditions below read -- see the note on `reachableOnTrace`. */
type TraceMemberColumns = {
  deletedAt: AnyMySqlColumn<{ data: Date }>
  foreign: AnyMySqlColumn<{ data: boolean }>
}

/** The `user_contacts` column that says the address was confirmed. */
type TraceAddressColumns = {
  emailChecked: AnyMySqlColumn<{ data: boolean }>
}

/**
 * Whether a member on the referral trace can still be reached: their account is there, and
 * it belongs to this community.
 *
 * ⛔ ONE rule, used by everything that reads the trace, and that is the whole point of it
 * being a function. The overview tile mirrors an arrival back and the contact list holds
 * the same people permanently; two copies of this condition would be two locks that drift,
 * and the drift shows up as the tile naming somebody the list does not know, or the other
 * way round -- with nothing on either screen to say which of them is wrong.
 *
 * `foreign = false` is not derived from the deletion mark: a member on this trace is always
 * local by the way `referrer_id` is written (a transaction link of this community, or an
 * address on this community's server), and spelling it out keeps the condition true if that
 * ever changes.
 *
 * ⚠️ Typed by the two COLUMNS it reads rather than by `typeof usersTable`, because half the
 * callers hand it an aliased copy of that table (`alias(usersTable, 'referrer')`), whose
 * type carries the alias as its table name and is therefore not the same type.
 */
const reachableOnTrace = (member: TraceMemberColumns) =>
  and(isNull(member.deletedAt), eq(member.foreign, false))

/**
 * Whether an arrival counts: reachable as above, and somebody walked through the door of
 * the confirmation mail.
 *
 * ⛔ The address condition belongs HERE rather than at each caller. The trace is written at
 * registration, before the address is confirmed, so counting every row would let anybody
 * raise an echo at a stranger -- or plant themselves in a stranger's contact list -- by
 * registering made-up accounts under that stranger's name in the address (G §11.10,
 * KF-013). A confirmed address is a door somebody had to walk through.
 *
 * `address` is the `user_contacts` row `users.email_id` points at, which is the address in
 * force; the caller joins it.
 */
const confirmedArrival = (member: TraceMemberColumns, address: TraceAddressColumns) =>
  and(reachableOnTrace(member), eq(address.emailChecked, true))

/**
 * The public name of whoever brought this member here, or null when nobody did.
 *
 * `users.referrer_id` has been written since 2022 and this was its first reader; the
 * contact list is the second and third (`dbSelectReferralContactsByUserId` below).
 * Through `publicAlias`, because the wallet puts the answer in front of the member and a
 * stored alias of one or two characters is not a name (the rule lives in `shared` so all
 * three packages give the same answer).
 *
 * A referrer whose account is gone is no answer: the wallet would offer to thank somebody
 * who cannot receive anything. That condition is `reachableOnTrace` above, shared with
 * everything else that reads this trace.
 *
 * ⚠️ The asking member's own deletion mark is a separate matter and stays here: it is
 * about who is asking, not about who is being named.
 */
export async function dbFindReferrerAlias(userId: number): Promise<string | null> {
  const referrer = aliasedTable(usersTable, 'referrer')
  const rows = await drizzleDb()
    .select({ alias: referrer.alias, gradidoId: referrer.gradidoId })
    .from(usersTable)
    .innerJoin(referrer, eq(usersTable.referrerId, referrer.id))
    .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt), reachableOnTrace(referrer)))
    .limit(1)
  return rows.length ? publicAlias(rows[0].alias, rows[0].gradidoId) : null
}

/**
 * The most recent person who arrived over this member, and whether they are the only one
 * - what the tile mirrors back.
 *
 * ⛔ Only CONFIRMED addresses count, and only accounts that are still there -- that whole
 * condition is `confirmedArrival` above, shared with the contact list so the tile and the
 * list can never name different people.
 *
 * `first` is what carries "only first times" (ZE-006): the warm sentence belongs to the
 * first arrival, every further one is reported plainly. Two rows are enough to answer it,
 * which is why the limit is 2 and there is no count - one row back means this is the only
 * one.
 *
 * ⚠️ `first` is measured on the arrivals that are still there, not on everyone who ever
 * arrived. Somebody who came over this member and has since deleted their account leaves
 * no trace here, so a later arrival is greeted as the first - which is what the member
 * sees anyway, because the deleted one disappeared from the tile when it was deleted.
 * Reading deleted rows to decide what a third party is told would give a closed account
 * an after-life it was closed to end (AGENTS.md, Pillar 2). The test below pins this.
 */
export async function dbFindLatestArrival(referrerId: number): Promise<ReferralArrival | null> {
  const rows = await drizzleDb()
    .select({
      alias: usersTable.alias,
      gradidoId: usersTable.gradidoId,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .innerJoin(userContactsTable, eq(usersTable.emailId, userContactsTable.id))
    .where(
      and(eq(usersTable.referrerId, referrerId), confirmedArrival(usersTable, userContactsTable)),
    )
    .orderBy(desc(usersTable.createdAt))
    .limit(2)
  if (!rows.length) {
    return null
  }
  return {
    alias: publicAlias(rows[0].alias, rows[0].gradidoId),
    createdAt: rows[0].createdAt,
    first: rows.length === 1,
  }
}

/** One arrival as the tile shows it: who, when, and whether it is the only one. */
export type ReferralArrival = {
  alias: string
  createdAt: Date
  first: boolean
}

/**
 * One row of the referral trace, in the shape the contact list groups by.
 *
 * ⛔ Structurally `ContactRow` (queries/transactions.ts), and NOT its declared type: that
 * type lives in the file that calls this one, so importing it here would close a circle
 * between the two query modules. The caller assigns these rows to `ContactRow[]`, and that
 * assignment is where the compiler checks the two shapes still agree -- the check is there
 * rather than here on purpose, because that is the place the agreement matters.
 *
 * `bookings` is 0 and `deletedAt` is null by construction: nobody has exchanged anything
 * with this person yet, and a deleted account is not on this list at all.
 */
export type ReferralContact = {
  linkedUserId: number
  communityUuid: string
  gradidoId: string
  alias: string | null
  deletedAt: null
  firstAt: Date
  lastAt: Date
  bookings: number
  origin: ContactOrigin
}

/**
 * The people this member is a contact of through the referral trace: whoever showed them
 * Gradido, and whoever came here over them.
 *
 * The second source of the contact list (KF-012, decided 20.09.2026). A contact arises from
 * a shared event and is therefore mutual and never added by hand -- a booking was the only
 * such event the list knew, and the invitation is the other one. It is already written:
 * `users.referrer_id` since 2022, so this reads a trace rather than starting to keep one.
 * No table, no write, no process that could fall out of step.
 *
 * Two looks at `users`, one per direction:
 *
 *   - ONE row at most for whoever brought the asking member here, dated with the asking
 *     member's OWN `created_at` -- the day this contact began is the day they registered,
 *     not the day the other person did;
 *   - one row per person who came over them, dated with THAT person's `created_at` -- the
 *     same date the overview tile shows, so the list and the tile sort a person to the same
 *     place (A6).
 *
 * `firstAt` and `lastAt` are that one date twice: an arrival is a single moment, not a span.
 * Where the same person is also a booking counterparty, `mergeSamePerson` widens the span
 * over both and the contact carries its bookings AND its origin.
 *
 * ⛔ The conditions are `reachableOnTrace` and `confirmedArrival` above, the same two the
 * overview tile stands on. Only confirmed arrivals appear -- which does not make planting
 * yourself in a stranger's list impossible, it makes it exactly as hard as raising an echo
 * at them: a confirmed address, one per person. With a booking anybody can do the same
 * today, which is the measured reason KF-015 leaves removal for later.
 *
 * ⛔ `alias` is the stored one, raw, exactly as the booking branch of the contact list
 * hands it over -- NOT `publicAlias`. The list searches on this field, and the fallback to
 * the gradidoID would let a search for a member's id match a person no booking would match.
 * The resolver builds the name from the `users` row it loads anyway.
 *
 * ⚠️ No cap. The trace is bounded by the same order of magnitude as the bookings the
 * caller already holds in memory (713 counterparties for the busiest account measured), and
 * a cap here would silently drop people from a list whose promise is "everybody, once".
 *
 * ⚠️ A row naming itself as its own referrer is left out of both looks. It cannot arise from
 * registration, but it would put the member into their own contact list with a button
 * offering to send Gradido to themselves -- which `addFavorite` already refuses in words.
 */
export async function dbSelectReferralContactsByUserId(userId: number): Promise<ReferralContact[]> {
  const db = drizzleDb()
  const referrer = aliasedTable(usersTable, 'referrer')

  const showedMe = await db
    .select({
      linkedUserId: referrer.id,
      communityUuid: referrer.communityUuid,
      gradidoId: referrer.gradidoId,
      alias: referrer.alias,
      // The asking member's own registration: the day THIS contact began.
      at: usersTable.createdAt,
    })
    .from(usersTable)
    .innerJoin(referrer, eq(usersTable.referrerId, referrer.id))
    .where(
      and(
        eq(usersTable.id, userId),
        isNull(usersTable.deletedAt),
        ne(referrer.id, userId),
        reachableOnTrace(referrer),
      ),
    )
    .limit(1)

  const cameOverMe = await db
    .select({
      linkedUserId: usersTable.id,
      communityUuid: usersTable.communityUuid,
      gradidoId: usersTable.gradidoId,
      alias: usersTable.alias,
      at: usersTable.createdAt,
    })
    .from(usersTable)
    .innerJoin(userContactsTable, eq(usersTable.emailId, userContactsTable.id))
    .where(
      and(
        eq(usersTable.referrerId, userId),
        ne(usersTable.id, userId),
        confirmedArrival(usersTable, userContactsTable),
      ),
    )

  const asContact = (
    row: {
      linkedUserId: number
      communityUuid: string
      gradidoId: string
      alias: string | null
      at: Date
    },
    origin: ContactOrigin,
  ): ReferralContact => ({
    linkedUserId: row.linkedUserId,
    communityUuid: row.communityUuid,
    gradidoId: row.gradidoId,
    alias: row.alias,
    deletedAt: null,
    firstAt: row.at,
    lastAt: row.at,
    bookings: 0,
    origin,
  })

  return [
    ...showedMe.map((row) => asContact(row, ContactOrigin.REFERRER)),
    ...cameOverMe.map((row) => asContact(row, ContactOrigin.ARRIVAL)),
  ]
}

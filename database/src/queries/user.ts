import { and, eq, isNull, or } from 'drizzle-orm'
import { getLogger } from 'log4js'
import { aliasSchema, emailSchema, Result, uuidv4Schema, VoidResult } from 'shared'
import { EntityManager, In, Raw } from 'typeorm'
import { drizzleDb } from '../AppDatabase'
import { User as DbUser, UserContact as DbUserContact } from '../entity'
import { DBNotFoundError } from '../errorTypes'
import { usersTable } from '../schemas/drizzle.schema'
import { findWithCommunityIdentifier, LOG4JS_QUERIES_CATEGORY_NAME } from './index'
import { dbAliasHeldByOther, dbFindAliasOwner } from './userAliases'

export async function aliasExists(alias: string, userId?: number): Promise<boolean> {
  // Only local users count. Aliases are unique per community, not globally: migration
  // 0073 dropped the global UNIQUE on users.alias in favour of UNIQUE(alias, community_uuid).
  // Rows with foreign = 1 are cached copies of members of other communities, so an alias
  // held there must not block a member of this one.
  const user = await DbUser.findOne({ where: { alias, foreign: false } })
  if (user !== null && (userId === undefined || user.id !== userId)) {
    return true
  }
  // A name somebody left behind stays theirs, so it stays blocked - except for its own
  // owner, who may take it back.
  return dbAliasHeldByOther(alias, userId)
}

/**
 * ⚠️ Pass `manager` from inside a transaction. Without it this reads over its own
 * connection, so a caller that holds the member's row under `SELECT ... FOR UPDATE` and
 * then saves what it read here would be writing an entity it loaded from beside its own
 * transaction rather than from within it.
 *
 * Renamed from `getUserById` for AGENTS.md's `db…` rule, because this delivery touched it.
 * Five executing functions in this file still carry no prefix (`aliasExists`,
 * `findForeignUserByUuids`, `findUserByUuids`, `findUserNamesByIds`, `findUserByIdentifier`)
 * - together 68 call sites against this one's 6, so they are their own mechanical change and
 * not this one's. Until they follow, the file has two conventions and this note is the only
 * thing saying which way it is going.
 */
export async function dbGetUserById(
  id: number,
  withCommunity: boolean = false,
  withEmailContact: boolean = false,
  manager?: EntityManager,
): Promise<DbUser> {
  const options = {
    where: { id },
    relations: { community: withCommunity, emailContact: withEmailContact },
  }
  return manager ? manager.findOneOrFail(DbUser, options) : DbUser.findOneOrFail(options)
}

/**
 * A user together with the role row that isAuthorized reads for the logged-in person -
 * for somebody who is NOT logged in but acts through a stored id, the first-creation
 * signer. Deleted accounts come back too (`withDeleted`): the caller decides what a
 * deleted signer means, and "not found" would hide that it was ever somebody.
 *
 * Not found IS an expected outcome here: the stored id may point at an account that has
 * since been removed for good.
 */
export async function dbGetUserWithRolesById(id: number): Promise<Result<DbUser, DBNotFoundError>> {
  const user = await DbUser.findOne({
    where: { id },
    withDeleted: true,
    relations: { userRoles: true, emailContact: true },
  })
  return user
    ? { success: true, value: user }
    : { success: false, error: new DBNotFoundError('users', `id = ${id}`) }
}

/**
 *
 * @param identifier could be gradidoID, alias or email of user
 * @param communityIdentifier could be uuid or name of community
 * @returns
 */
export const findUserByIdentifier = async (
  identifier: string,
  communityIdentifier?: string,
): Promise<DbUser | null> => {
  const communityWhere = communityIdentifier
    ? findWithCommunityIdentifier(communityIdentifier)
    : undefined

  if (uuidv4Schema.safeParse(identifier).success) {
    return DbUser.findOne({
      where: { gradidoID: identifier, community: communityWhere },
      relations: ['emailContact', 'community'],
    })
  } else if (emailSchema.safeParse(identifier).success) {
    const userContact = await DbUserContact.findOne({
      where: {
        email: identifier,
        emailChecked: true,
        user: {
          community: communityWhere,
        },
      },
      relations: { user: { community: true } },
    })
    if (userContact) {
      // `UserContact.user` is the inverse of `users.email_id`, so it is EMPTY for every row
      // that is not the address currently in force - and since the e-mail change a member
      // keeps a confirmed row for every address they ever held. `emailChecked` does not tell
      // the two apart: an address one gave up stays checked. Without this guard the query
      // returned such an orphaned row (the relation condition is a LEFT JOIN, and an absent
      // community identifier adds no condition at all) and the next line wrote to null.
      //
      // Answering "not found" is what `findUserByEmail` does with the same input, so the two
      // ways of asking agree. Whether a FORMER address should still lead to its owner - the
      // way a former alias does further down - is a product question, not this one's to
      // settle.
      if (!userContact.user) {
        return null
      }
      // TODO: remove circular reference
      const user = userContact.user
      user.emailContact = userContact
      return user
    }
  } else if (aliasSchema.safeParse(identifier).success) {
    const normedAlias = Raw((a) => `LOWER(${a}) = LOWER(:alias)`, { alias: identifier })
    const foundUser = await DbUser.findOne({
      where: { alias: normedAlias, community: communityWhere },
      relations: ['emailContact', 'community'],
    })
    if (foundUser !== null) {
      return foundUser
    }
    // Not a current name - but an earlier one still leads to its owner, which is what
    // keeps a printed card working after a rename. Looking the row up by alias alone
    // avoids the community identifier here: it may be a name rather than a uuid, and
    // only local members have rows at all.
    const owner = await dbFindAliasOwner(identifier)
    if (owner) {
      return DbUser.findOne({
        where: { id: owner.userId, community: communityWhere },
        relations: ['emailContact', 'community'],
      })
    }
  } else {
    // should don't happen often, so we create only in the rare case a logger for it
    getLogger(`${LOG4JS_QUERIES_CATEGORY_NAME}.user.findUserByIdentifier`).warn(
      'Unknown identifier type',
      identifier,
    )
  }
  return null
}

/**
 * The `users` row the federation stored for a member of another community, by the pair.
 *
 * `communityUuid` may be null: a booking row carries none when the other community had no
 * uuid yet, and the lookup then goes by the gradido id alone -- spelled out, because TypeORM
 * would otherwise drop an `undefined` from the `where` silently and the reader could not
 * tell the two lookups apart.
 */
export async function findForeignUserByUuids(
  communityUuid: string | null,
  gradidoID: string,
): Promise<DbUser | null> {
  return DbUser.findOne({
    where:
      communityUuid === null
        ? { foreign: true, gradidoID }
        : { foreign: true, communityUuid, gradidoID },
  })
}

/**
 * Every `users` row the federation stored for members of other communities with one of
 * these gradido ids -- one query for a whole page of contacts, where one per contact would
 * be one round trip per person. The caller matches the pair; here it is the id alone,
 * because a uuid is unique for every practical purpose and the caller's pair check is
 * the second lock.
 */
export async function dbFindForeignUsersByGradidoIds(gradidoIds: string[]): Promise<DbUser[]> {
  if (gradidoIds.length === 0) {
    return []
  }
  return DbUser.find({ where: { foreign: true, gradidoID: In(gradidoIds) } })
}

/**
 * The `users` rows for a set of ids, in one query -- how a list resolves its local
 * counterparties. `withDeleted`: a booking keeps naming a member whose account is gone
 * (AS-009 leaves them the name and takes the picture), so the lists pass true.
 *
 * TypeORM as it was in the resolvers (AGENTS.md, step 1: move); translated with the rest
 * of this file.
 */
export async function dbFindUsersByIds(
  userIds: number[],
  options: { withDeleted?: boolean } = {},
): Promise<DbUser[]> {
  if (userIds.length === 0) {
    return []
  }
  return DbUser.find({ where: { id: In(userIds) }, withDeleted: options.withDeleted ?? false })
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

export async function findUserByUuids(
  communityUuid: string,
  gradidoID: string,
  foreign: boolean = false,
): Promise<DbUser | null> {
  return DbUser.findOne({
    where: { foreign, communityUuid, gradidoID },
    relations: ['emailContact'],
  })
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
  const users = await DbUser.find({
    // No `alias`: it was selected and never read, which made this function look like it
    // was about to hand one out.
    select: { id: true, firstName: true, lastName: true },
    where: { id: In(userIds) },
  })
  return new Map(
    users.map((user) => {
      return [user.id, `${user.firstName} ${user.lastName}`]
    }),
  )
}

/** Persist a member - inside the caller's transaction when given. */
export async function dbSaveUser(user: DbUser, manager?: EntityManager): Promise<DbUser> {
  return manager ? manager.save(user) : DbUser.save(user)
}

/**
 * Re-key the stored password: exactly these two columns, nothing else. Callers hold a
 * request-context snapshot that may be minutes old, and a full entity `save()` diffs
 * against the row as of NOW - it would write every stale column back, `users.email_id`
 * above all, undoing whatever committed in between.
 */
export async function dbUpdateUserPassword(
  userId: number,
  password: DbUser['password'],
  passwordEncryptionType: DbUser['passwordEncryptionType'],
): Promise<void> {
  await DbUser.update({ id: userId }, { password, passwordEncryptionType })
}

/**
 * Holds the member's row under a write lock for the rest of the caller's transaction -
 * the plain way to run "look, then change" for one member without a second request
 * slipping in between (the e-mail change: one pending change, one mail per window).
 * Returns nothing; the caller already holds the member.
 */
export async function dbLockUserRow(userId: number, manager: EntityManager): Promise<void> {
  await manager.findOne(DbUser, { where: { id: userId }, lock: { mode: 'pessimistic_write' } })
}

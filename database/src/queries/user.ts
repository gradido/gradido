import { eq } from 'drizzle-orm'
import { getLogger } from 'log4js'
import { aliasSchema, emailSchema, uuidv4Schema, VoidResult } from 'shared'
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

export async function getUserById(
  id: number,
  withCommunity: boolean = false,
  withEmailContact: boolean = false,
): Promise<DbUser> {
  return DbUser.findOneOrFail({
    where: { id },
    relations: { community: withCommunity, emailContact: withEmailContact },
  })
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

export async function findForeignUserByUuids(
  communityUuid: string,
  gradidoID: string,
): Promise<DbUser | null> {
  return DbUser.findOne({
    where: { foreign: true, communityUuid, gradidoID },
  })
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
 * Holds the member's row under a write lock for the rest of the caller's transaction -
 * the plain way to run "look, then change" for one member without a second request
 * slipping in between (the e-mail change: one pending change, one mail per window).
 * Returns nothing; the caller already holds the member.
 */
export async function dbLockUserRow(userId: number, manager: EntityManager): Promise<void> {
  await manager.findOne(DbUser, { where: { id: userId }, lock: { mode: 'pessimistic_write' } })
}

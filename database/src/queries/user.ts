import { desc, eq, inArray } from 'drizzle-orm'
import { getLogger } from 'log4js'
import { aliasSchema, emailSchema, Result, uuidv4Schema, VoidResult } from 'shared'
import { In, Raw } from 'typeorm'
import { drizzleDb } from '../AppDatabase'
import { User as DbUser, UserContact as DbUserContact } from '../entity'
import { DBInsertFailed, DBNotFoundError } from '../errorTypes'
import {
  UserContactInsert,
  UserInsert,
  UserRoleInsert,
  UserSelect,
  userContactsTable,
  userRolesTable,
  usersTable,
} from '../schemas/drizzle.schema'
import { findWithCommunityIdentifier, LOG4JS_QUERIES_CATEGORY_NAME } from './index'

const UserInsertFailed = (row: UserInsert) => new DBInsertFailed<UserInsert>('users', row)
const UserNotFound = (where: string) => new DBNotFoundError('users', where)

export async function aliasExists(alias: string): Promise<boolean> {
  const user = await DbUser.findOne({
    where: { alias: Raw((a) => `LOWER(${a}) = LOWER(:alias)`, { alias }) },
  })
  return user !== null
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
    return await DbUser.findOne({
      where: { alias: identifier, community: communityWhere },
      relations: ['emailContact', 'community'],
    })
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

export async function findUserNamesByIds(userIds: number[]): Promise<Map<number, string>> {
  const users = await DbUser.find({
    select: { id: true, firstName: true, lastName: true, alias: true },
    where: { id: In(userIds) },
  })
  return new Map(
    users.map((user) => {
      return [user.id, `${user.firstName} ${user.lastName}`]
    }),
  )
}

// --- drizzle ---

export async function dbInsertUser(
  user: UserInsert,
): Promise<Result<UserSelect, DBInsertFailed<UserInsert>>> {
  const result = await drizzleDb().insert(usersTable).values(user)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    const inserted = await dbFindUserById(user.id ?? firstRow.insertId)
    if (inserted) {
      return { success: true, value: inserted }
    }
  }
  return { success: false, error: UserInsertFailed(user) }
}

export async function dbFindUserById(id: number): Promise<UserSelect | undefined> {
  const result = await drizzleDb().select().from(usersTable).where(eq(usersTable.id, id)).limit(1)
  return result.at(0)
}

export async function dbFindUsersByIds(ids: number[]): Promise<UserSelect[]> {
  if (ids.length === 0) {
    return []
  }
  return drizzleDb().select().from(usersTable).where(inArray(usersTable.id, ids))
}

/**
 * Highest id currently in the table, or 0 when it is empty.
 * Used by the bulk seed factory, which assigns ids manually.
 */
export async function dbFindLastUserId(): Promise<number> {
  const result = await drizzleDb()
    .select({ id: usersTable.id })
    .from(usersTable)
    .orderBy(desc(usersTable.id))
    .limit(1)
  return result.at(0)?.id ?? 0
}

export async function dbUpdateUserEmailId(
  id: number,
  emailId: number,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb().update(usersTable).set({ emailId }).where(eq(usersTable.id, id))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: UserNotFound(`id = ${id}`) }
}

export async function dbUpdateUserPassword(
  id: number,
  password: bigint,
): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb().update(usersTable).set({ password }).where(eq(usersTable.id, id))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true }
  }
  return { success: false, error: UserNotFound(`id = ${id}`) }
}

/**
 * Inserts users together with their contacts and roles in a single transaction.
 * The three tables belong to one atomic write, so they must not be split across
 * separate calls. Ids are expected to be assigned by the caller (bulk seeding).
 */
export async function dbInsertUsersWithContactsAndRoles(
  users: UserInsert[],
  userContacts: UserContactInsert[],
  userRoles: UserRoleInsert[],
): Promise<VoidResult<DBInsertFailed<UserInsert>>> {
  if (users.length === 0) {
    return { success: true }
  }
  await drizzleDb().transaction(async (tx) => {
    await tx.insert(usersTable).values(users)
    if (userContacts.length > 0) {
      await tx.insert(userContactsTable).values(userContacts)
    }
    if (userRoles.length > 0) {
      await tx.insert(userRolesTable).values(userRoles)
    }
  })
  return { success: true }
}

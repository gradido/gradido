import { Column, ColumnBaseConfig, ColumnDataType, desc, eq, gt, inArray, SQL } from 'drizzle-orm'
import { DEFAULT_PAGINATION_PAGE_SIZE, MAX_PAGINATION_PAGE_SIZE, Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundAfterInsertError, DBNotFoundError } from '../errorTypes'
import { FullUser } from '../schemas'
import {
  communitiesTable,
  UserContactInsert,
  UserInsert,
  UserRoleInsert,
  UserRoleSelect,
  UserSelect,
  userContactsTable,
  userRolesTable,
  usersTable,
} from '../schemas/drizzle.schema'

const userInsertFailed = (row: UserInsert) => new DBInsertFailed<UserInsert>('users', row)
const userNotFound = (where: string) => new DBNotFoundError('users', where)
const userNotFoundAfterInsertError = (row: UserInsert, where: string) =>
  new DBNotFoundAfterInsertError<UserInsert>('users', row, where)

/*
 * only insert user and return insert id
 */
export async function dbInsertUser(
  user: UserInsert,
): Promise<Result<number, DBInsertFailed<UserInsert>>> {
  const result = await drizzleDb().insert(usersTable).values(user)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true, value: firstRow.insertId }
  }
  return { success: false, error: userInsertFailed(user) }
}

export async function dbFindUserById(id: number): Promise<UserSelect | undefined> {
  const result = await drizzleDb().select().from(usersTable).where(eq(usersTable.id, id))
  if (result.length > 1) {
    throw new Error('get more than one result for a user by id search')
  }
  return result.at(0)
}

export async function dbFindUserByEmail(email: string): Promise<UserSelect | undefined> {
  const result = await drizzleDb()
    .select()
    .from(usersTable)
    .leftJoin(userContactsTable, eq(usersTable.emailId, userContactsTable.id))
    .where(eq(userContactsTable.email, email))

  if (result.length > 1) {
    throw new Error('get more than one result for a user by email search')
  }
  const firstRow = result[0]
  if (firstRow) {
    return firstRow.users
  }
}

export async function dbInsertAndSelectUser(
  userInput: UserInsert,
): Promise<Result<UserSelect, DBInsertFailed<UserInsert>>> {
  const result = await dbInsertUser(userInput)
  if (result.success) {
    const user = await dbFindUserById(result.value)
    if (!user) {
      throw userNotFoundAfterInsertError(userInput, `users.id = ${result.value}`)
    }
    return { success: true, value: user }
  }
  return result
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

// return affectedRows
export async function dbUpdateUser(
  id: number,
  updatedFields: Partial<UserInsert>,
): Promise<Result<number, DBNotFoundError>> {
  const result = await drizzleDb()
    .update(usersTable)
    .set(updatedFields)
    .where(eq(usersTable.id, id))

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 0) {
    if (!(await dbFindUserById(id))) {
      return { success: false, error: userNotFound(`id = ${id}`) }
    }
  }
  return { success: true, value: firstRow.affectedRows }
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

async function dbFindUserWithAllRelations<
  F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>,
  V extends F['_']['data'],
>(field: F, value: V, operator: typeof eq): Promise<FullUser | undefined>

async function dbFindUserWithAllRelations<
  F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>,
  V extends F['_']['data'][],
>(field: F, value: V, operator: typeof inArray): Promise<FullUser[] | undefined>

async function dbFindUserWithAllRelations<
  F extends Column<ColumnBaseConfig<ColumnDataType, string>, object, object>,
  V extends F['_']['data'] | F['_']['data'][],
>(
  field: F,
  value: V,
  operator: (field: F, value: V) => SQL = eq,
): Promise<FullUser | FullUser[] | undefined> {
  const result = await drizzleDb()
    .select()
    .from(usersTable)
    .innerJoin(userContactsTable, eq(usersTable.emailId, userContactsTable.id))
    .leftJoin(userRolesTable, eq(userRolesTable.userId, usersTable.id))
    .leftJoin(communitiesTable, eq(usersTable.communityUuid, communitiesTable.communityUuid))
    .where(operator(field, value))

  if (result.length > 1) {
    throw new Error('please call dbFindUserWithAllRelations only with a unique field value')
  }
  const firstRow = result[0]
  if (firstRow) {
    const roles = result
      .map((row) => row.user_roles)
      .filter((role): role is UserRoleSelect => role !== null)

    return {
      ...firstRow.users,
      community: firstRow.communities,
      userRoles: roles,
      emailContact: firstRow.user_contacts,
    }
  }
}

export async function dbFindUserByIdWithAllRelations(
  userId: number,
): Promise<Result<FullUser, DBNotFoundError>> {
  const result = await dbFindUserWithAllRelations(usersTable.id, userId, eq)
  if (result) {
    return { success: true, value: result }
  }
  return { success: false, error: userNotFound(`users.id = ${userId}`) }
}

export async function dbFindUsersByIdWitlAllRelations(
  userIds: number[],
): Promise<Result<FullUser[], DBNotFoundError>> {
  const result = await dbFindUserWithAllRelations(usersTable.id, userIds, eq)
  if (result) {
    return { success: true, value: result }
  }
  return { success: false, error: userNotFound(`users.id = in (${userIds})`) }
}

export async function dbFindUserByEmailWithAllRelations(
  email: string,
): Promise<Result<FullUser, DBNotFoundError>> {
  const result = await dbFindUserWithAllRelations(userContactsTable.email, email, eq)
  if (result) {
    return { success: true, value: result }
  }
  return { success: false, error: userNotFound(`user_contacts.email = ${email}`) }
}

export async function dbListUsers(
  lastIndex: number = 0,
  count = DEFAULT_PAGINATION_PAGE_SIZE,
): Promise<UserSelect[]> {
  if (count > MAX_PAGINATION_PAGE_SIZE) {
    throw new Error(
      `${count} db entries were requested, but max allowed by constant is: ${MAX_PAGINATION_PAGE_SIZE}`,
    )
  }
  if (lastIndex < 0 || count < 0) {
    throw new Error('invalid parameter, lastIndex and count must both be >= 0')
  }
  return drizzleDb().select().from(usersTable).where(gt(usersTable.id, lastIndex)).limit(count)
}

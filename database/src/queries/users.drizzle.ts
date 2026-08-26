import { desc, eq, inArray } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundAfterInsertError, DBNotFoundError } from '../errorTypes'
import {
  UserContactInsert,
  UserInsert,
  UserRoleInsert,
  UserSelect,
  userContactsTable,
  userRolesTable,
  usersTable,
} from '../schemas/drizzle.schema'

const userInsertFailed = (row: UserInsert) => new DBInsertFailed<UserInsert>('users', row)
const userNotFound = (where: string) => new DBNotFoundError('users', where)
const userNotFoundAfterInsertError = (row: UserInsert, where: string) => new DBNotFoundAfterInsertError<UserInsert>('users', row, where)

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
  const result = await drizzleDb().select().from(usersTable).where(eq(usersTable.id, id)).limit(1)
  return result.at(0)
}

export async function dbInsertAndSelectUser(
  userInput: UserInsert
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
  updatedFields: Partial<UserInsert>
): Promise<Result<number, DBNotFoundError>> {
  const result = await drizzleDb()
      .update(usersTable)
      .set(updatedFields)
      .where(eq(usersTable.id, id))
  
  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 0) {
    if (!await dbFindUserById(id)) {
      return { success: false, error: userNotFound(`id = ${id}`)}
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
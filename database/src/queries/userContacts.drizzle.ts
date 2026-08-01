import { desc, eq, inArray } from 'drizzle-orm'
import { Result } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundAfterInsertError } from '../errorTypes'
import { UserContactInsert, UserContactSelect, userContactsTable } from '../schemas/drizzle.schema'

const userContactInsertFailed = (row: UserContactInsert) =>
  new DBInsertFailed<UserContactInsert>('user_contacts', row)
const userContactNotFoundAfterInsertError = (row: UserContactInsert, where: string) =>
  new DBNotFoundAfterInsertError<UserContactInsert>('user_contacts', row, where)

export async function dbInsertUserContact(
  userContact: UserContactInsert,
): Promise<Result<number, DBInsertFailed<UserContactInsert>>> {
  const result = await drizzleDb().insert(userContactsTable).values(userContact)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true, value: firstRow.insertId }
  }
  return { success: false, error: userContactInsertFailed(userContact) }
}

export async function dbFindUserContactById(id: number): Promise<UserContactSelect | undefined> {
  const result = await drizzleDb()
    .select()
    .from(userContactsTable)
    .where(eq(userContactsTable.id, id))
    .limit(1)
  return result.at(0)
}

export async function dbInsertAndSelectUserContact(
  userInput: UserContactInsert,
): Promise<Result<UserContactSelect, DBInsertFailed<UserContactInsert>>> {
  const result = await dbInsertUserContact(userInput)
  if (result.success) {
    const user = await dbFindUserContactById(result.value)
    if (!user) {
      throw userContactNotFoundAfterInsertError(userInput, `users.id = ${result.value}`)
    }
    return { success: true, value: user }
  }
  return result
}

export async function dbFindUserContactsByUserId(userId: number): Promise<UserContactSelect[]> {
  return drizzleDb().select().from(userContactsTable).where(eq(userContactsTable.userId, userId))
}

export async function dbFindUserContactsByUserIds(userIds: number[]): Promise<UserContactSelect[]> {
  if (userIds.length === 0) {
    return []
  }
  return drizzleDb()
    .select()
    .from(userContactsTable)
    .where(inArray(userContactsTable.userId, userIds))
}

export async function dbFindUserContactByEmail(
  email: string,
): Promise<UserContactSelect | undefined> {
  const result = await drizzleDb()
    .select()
    .from(userContactsTable)
    .where(eq(userContactsTable.email, email))
    .limit(1)
  return result.at(0)
}

/**
 * Highest id currently in the table, or 0 when it is empty.
 * Used by the bulk seed factory, which assigns ids manually.
 */
export async function dbFindLastUserContactId(): Promise<number> {
  const result = await drizzleDb()
    .select({ id: userContactsTable.id })
    .from(userContactsTable)
    .orderBy(desc(userContactsTable.id))
    .limit(1)
  return result.at(0)?.id ?? 0
}

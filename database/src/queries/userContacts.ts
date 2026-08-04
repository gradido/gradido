import { desc, eq, inArray } from 'drizzle-orm'
import { Result } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed } from '../errorTypes'
import { UserContactInsert, UserContactSelect, userContactsTable } from '../schemas/drizzle.schema'

const UserContactInsertFailed = (row: UserContactInsert) =>
  new DBInsertFailed<UserContactInsert>('user_contacts', row)

export async function dbInsertUserContact(
  userContact: UserContactInsert,
): Promise<Result<UserContactSelect, DBInsertFailed<UserContactInsert>>> {
  const result = await drizzleDb().insert(userContactsTable).values(userContact)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    const inserted = await dbFindUserContactById(userContact.id ?? firstRow.insertId)
    if (inserted) {
      return { success: true, value: inserted }
    }
  }
  return { success: false, error: UserContactInsertFailed(userContact) }
}

export async function dbFindUserContactById(id: number): Promise<UserContactSelect | undefined> {
  const result = await drizzleDb()
    .select()
    .from(userContactsTable)
    .where(eq(userContactsTable.id, id))
    .limit(1)
  return result.at(0)
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

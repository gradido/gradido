import { eq, inArray } from 'drizzle-orm'
import { Result } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed, DBNotFoundAfterInsertError } from '../errorTypes'
import { UserRoleInsert, UserRoleSelect, userRolesTable } from '../schemas/drizzle.schema'

const UserRoleInsertFailed = (row: UserRoleInsert) =>
  new DBInsertFailed<UserRoleInsert>('user_roles', row)
const userNotFoundAfterInsertError = (row: UserRoleInsert, where: string) =>
  new DBNotFoundAfterInsertError<UserRoleInsert>('users', row, where)

export async function dbInsertUserRole(
  userRole: UserRoleInsert,
): Promise<Result<number, DBInsertFailed<UserRoleInsert>>> {
  const result = await drizzleDb().insert(userRolesTable).values(userRole)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    return { success: true, value: firstRow.insertId }
  }
  return { success: false, error: UserRoleInsertFailed(userRole) }
}

export async function dbFindUserRoleById(id: number): Promise<UserRoleSelect | undefined> {
  const result = await drizzleDb().select().from(userRolesTable).where(eq(userRolesTable.id, id))
  if (result.length > 1) {
    throw new Error('get more than one result for a user_roles by id search')
  }
  return result.at(0)
}

export async function dbInsertAndSelectUserRoles(
  userRoleInput: UserRoleInsert,
): Promise<Result<UserRoleSelect, DBInsertFailed<UserRoleInsert>>> {
  const result = await dbInsertUserRole(userRoleInput)
  if (result.success) {
    const userRole = await dbFindUserRoleById(result.value)
    if (!userRole) {
      throw userNotFoundAfterInsertError(userRoleInput, `users.id = ${result.value}`)
    }
    return { success: true, value: userRole }
  }
  return result
}

export async function dbFindUserRolesByUserId(userId: number): Promise<UserRoleSelect[]> {
  return drizzleDb().select().from(userRolesTable).where(eq(userRolesTable.userId, userId))
}

export async function dbFindUserRolesByUserIds(userIds: number[]): Promise<UserRoleSelect[]> {
  if (userIds.length === 0) {
    return []
  }
  return drizzleDb().select().from(userRolesTable).where(inArray(userRolesTable.userId, userIds))
}

import { eq, inArray } from 'drizzle-orm'
import { Result } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBInsertFailed } from '../errorTypes'
import { UserRoleInsert, UserRoleSelect, userRolesTable } from '../schemas/drizzle.schema'

const UserRoleInsertFailed = (row: UserRoleInsert) =>
  new DBInsertFailed<UserRoleInsert>('user_roles', row)

export async function dbInsertUserRole(
  userRole: UserRoleInsert,
): Promise<Result<UserRoleSelect, DBInsertFailed<UserRoleInsert>>> {
  const result = await drizzleDb().insert(userRolesTable).values(userRole)

  const firstRow = result[0]
  if (firstRow && firstRow.affectedRows === 1) {
    const inserted = await dbFindUserRoleById(userRole.id ?? firstRow.insertId)
    if (inserted) {
      return { success: true, value: inserted }
    }
  }
  return { success: false, error: UserRoleInsertFailed(userRole) }
}

export async function dbFindUserRoleById(id: number): Promise<UserRoleSelect | undefined> {
  const result = await drizzleDb()
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.id, id))
    .limit(1)
  return result.at(0)
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

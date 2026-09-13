import { inArray } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { userRolesTable } from '../schemas/drizzle.schema'

/**
 * Give the member this role: the one row they have is changed, or their first is written.
 *
 * An upsert, because "one member, one role" is the unique key on `user_id` (migration
 * 0135) and a read-then-write from the caller would only reintroduce the race the key
 * removes: two admins granting a role to the same member at the same moment both saw no
 * row, both inserted, and the member ended up with two -- which the readers then
 * interpreted in three different ways. Now the second write updates the first.
 *
 * ⛔ `visible_creation_groups` is left as it is on a change. That is what setUserRole did
 * before this query existed (it saved `userRoles[0]` with a new role and nothing else),
 * and removing a role is what resets the scope -- see deleteUserRole.
 *
 * No affectedRows check, for the reason dbUpsertUserAvatar gives: INSERT .. ON DUPLICATE
 * KEY UPDATE answers 1, 2 or 0 depending on what was there, so the count cannot tell
 * success from failure. A real failure throws.
 */
export async function dbUpsertUserRole(userId: number, role: string): Promise<void> {
  await drizzleDb()
    .insert(userRolesTable)
    .values({ userId, role })
    .onDuplicateKeyUpdate({ set: { role, updatedAt: new Date() } })
}

/**
 * Remove every role of these members -- for each of them, the one row they may have.
 *
 * An empty list removes nothing and asks the database nothing: `inArray` over no values
 * would not be valid SQL.
 */
export async function dbRemoveUserRoles(userIds: number[]): Promise<void> {
  if (userIds.length === 0) {
    return
  }
  await drizzleDb().delete(userRolesTable).where(inArray(userRolesTable.userId, userIds))
}

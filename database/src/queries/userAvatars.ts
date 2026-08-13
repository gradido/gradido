// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import { UserAvatarInsert, UserAvatarSelect, userAvatarsTable } from '../schemas/drizzle.schema'

// TODO: replace results with valibot schema after update to typescript 5 is possible

const UserAvatarNotFound = (where: string) => new DBNotFoundError('user_avatars', where)

/**
 * The member's own profile picture, or a miss. Not having one is the normal state for
 * most accounts, so the miss is an expected result rather than an error.
 */
export async function dbFindUserAvatar(
  userId: number,
): Promise<Result<UserAvatarSelect, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select()
    .from(userAvatarsTable)
    .where(eq(userAvatarsTable.userId, userId))
    .limit(1)

  const avatar = rows.at(0)
  return avatar
    ? { success: true, value: avatar }
    : { success: false, error: UserAvatarNotFound(`userId = ${userId}`) }
}

/**
 * Sets the picture, replacing whatever was there. Upsert rather than insert-or-update
 * from the caller, because "one member, one picture" is already expressed by the
 * primary key and a read-then-write would only reintroduce the race the key removes.
 *
 * No affectedRows check on purpose. MySQL answers INSERT .. ON DUPLICATE KEY UPDATE
 * with 1 for a fresh row, 2 for a changed one and 0 when the row already held exactly
 * this value — so a row counter cannot tell success from failure here, and the most
 * common case of all (saving the same picture twice) would read as a failure. A real
 * write failure throws; reaching this line means the row is in place.
 */
export async function dbUpsertUserAvatar(row: UserAvatarInsert): Promise<VoidResult<never>> {
  await drizzleDb()
    .insert(userAvatarsTable)
    .values(row)
    .onDuplicateKeyUpdate({
      set: { image: row.image, mimeType: row.mimeType, updatedAt: new Date() },
    })

  return { success: true }
}

/**
 * Removes the picture. Unlike the upsert above, the row count carries meaning here:
 * a plain DELETE reports exactly how many rows it removed, so 0 says there was nothing
 * to remove — which the caller may well want to distinguish.
 */
export async function dbDeleteUserAvatar(userId: number): Promise<VoidResult<DBNotFoundError>> {
  const result = await drizzleDb()
    .delete(userAvatarsTable)
    .where(eq(userAvatarsTable.userId, userId))

  const firstRow = result[0]
  return firstRow && firstRow.affectedRows >= 1
    ? { success: true }
    : { success: false, error: UserAvatarNotFound(`userId = ${userId}`) }
}

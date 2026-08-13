// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import { UserAvatarInsert, userAvatarsTable } from '../schemas/drizzle.schema'

// TODO: replace results with valibot schema after update to typescript 5 is possible

const UserAvatarNotFound = (where: string) => new DBNotFoundError('user_avatars', where)

/**
 * The everyday picture, 128x128. This is the one other people are shown, so it is also
 * the one that reads on the common paths -- every wallet login asks for it.
 *
 * Selects the one column on purpose rather than the row: the full rendition next to it
 * is roughly ten times the size, and a `select()` would carry it out of the database on
 * every one of those logins only to have it thrown away.
 *
 * Not having a picture is the normal state for most accounts, so the miss is an expected
 * result rather than an error.
 */
export async function dbFindUserAvatarSmall(
  userId: number,
): Promise<Result<Buffer, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select({ avatarSmall: userAvatarsTable.avatarSmall })
    .from(userAvatarsTable)
    .where(eq(userAvatarsTable.userId, userId))
    .limit(1)

  const avatar = rows.at(0)
  return avatar
    ? { success: true, value: avatar.avatarSmall }
    : { success: false, error: UserAvatarNotFound(`userId = ${userId}`) }
}

/**
 * The full crop, 512x512, for the printed member card and for the member looking at
 * their own picture.
 *
 * ⛔ Own view only. This rendition has exactly one legitimate viewer, its owner, which
 * is why it carries no disclosure decision. Whoever calls this has to have established
 * that the caller IS the owner -- there is no scope where handing this to somebody else
 * is correct. Anything shown to other people reads dbFindUserAvatarSmall above.
 */
export async function dbFindUserAvatarFull(
  userId: number,
): Promise<Result<Buffer, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select({ avatarFull: userAvatarsTable.avatarFull })
    .from(userAvatarsTable)
    .where(eq(userAvatarsTable.userId, userId))
    .limit(1)

  const avatar = rows.at(0)
  return avatar
    ? { success: true, value: avatar.avatarFull }
    : { success: false, error: UserAvatarNotFound(`userId = ${userId}`) }
}

/**
 * Sets the picture, replacing whatever was there. Both renditions in one write: they
 * come from one crop, and a state where the small one is newer than the full one would
 * show the member two different pictures depending on where they look.
 *
 * Upsert rather than insert-or-update from the caller, because "one member, one picture"
 * is already expressed by the primary key and a read-then-write would only reintroduce
 * the race the key removes.
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
      set: {
        avatarSmall: row.avatarSmall,
        avatarFull: row.avatarFull,
        mimeType: row.mimeType,
        updatedAt: new Date(),
      },
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

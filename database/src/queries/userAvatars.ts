// AI-GENERATED — not an architecture reference
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { Result, VoidResult } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import { UserAvatarInsert, userAvatarsTable, usersTable } from '../schemas/drizzle.schema'

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
 * The one condition under which a picture may be shown to somebody other than its owner.
 *
 * ⚠️ It lives here, in the query, and not at the call site. A disclosure rule that every
 * reader has to remember to apply is not a rule; the first caller who forgets it publishes
 * a face, and nothing about the code says they were wrong. Both member-facing queries
 * below share this, so there is one place to read and one place to change.
 *
 * Two parts, and they are not the same kind of thing:
 *
 *   * the switch -- the member said other members may see it (AS-003);
 *   * not deleted -- somebody who closed their account can no longer reach the switch,
 *     and a disclosure the subject can no longer withdraw must not keep running (AS-009).
 *     The NAME of a deleted member still travels with old bookings, because it belongs to
 *     the counterparty's record. The face belongs to the person.
 *
 * Deliberately NOT part of it: whether a picture exists. That is what the join answers.
 */
const mayBeShownToMembers = () =>
  and(eq(usersTable.avatarVisibleToMembers, 1), isNull(usersTable.deletedAt))

export interface MemberAvatarRow {
  gradidoId: string
  communityUuid: string | null
  avatarSmall: Buffer
  updatedAt: Date
}

/**
 * The pictures of several members at once, for showing them next to shared bookings.
 *
 * Batched on purpose: the alternative is a field resolver on the user, which turns one
 * booking list into one database round trip per row. Handed a capped list by its caller --
 * the cap belongs to the API layer, which knows the page size; a query cannot know what a
 * reasonable request looks like.
 *
 * ★ Looked up by gradidoId rather than by the (gradidoId, communityUuid) pair the unique
 * key suggests, and that is a measured choice, not laziness: a local member only gets a
 * community_uuid if the home community had one when they registered
 * (UserResolver.createUser), so rows with NULL are real. Matching on the pair in SQL would
 * drop exactly those members, silently and with no error to notice. The pair comes back
 * with each row instead, so the caller can match what it asked for.
 *
 * A member who is not found, has no picture, or switched it off simply has no row in the
 * answer. Never an error for "no such member": that would turn this into a directory that
 * tells an anonymous asker which accounts exist.
 */
export async function dbFindMemberAvatarsSmall(gradidoIds: string[]): Promise<MemberAvatarRow[]> {
  if (gradidoIds.length === 0) {
    return []
  }

  return await drizzleDb()
    .select({
      gradidoId: usersTable.gradidoId,
      communityUuid: usersTable.communityUuid,
      avatarSmall: userAvatarsTable.avatarSmall,
      updatedAt: userAvatarsTable.updatedAt,
    })
    .from(userAvatarsTable)
    .innerJoin(usersTable, eq(usersTable.id, userAvatarsTable.userId))
    .where(and(inArray(usersTable.gradidoId, gradidoIds), mayBeShownToMembers()))
}

/**
 * When each of these members last changed their picture, for the members who have one to
 * show. Keyed by the internal id, because the caller already holds the user rows.
 *
 * This is what lets the wallet keep pictures between visits without asking whether they
 * are still current: a stored picture counts as fresh while its timestamp matches the one
 * that came with the list. A member missing from the map has nothing to show -- no
 * picture, switch off, or deleted -- which is the same answer the wallet needs either way.
 *
 * ⛔ Not a field resolver, for the same reason as above: one query for the whole list, not
 * one per row. It carries no picture data at all, so it stays cheap on a path that every
 * booking list takes.
 */
export async function dbFindMemberAvatarTimestamps(userIds: number[]): Promise<Map<number, Date>> {
  if (userIds.length === 0) {
    return new Map()
  }

  const rows = await drizzleDb()
    .select({ userId: userAvatarsTable.userId, updatedAt: userAvatarsTable.updatedAt })
    .from(userAvatarsTable)
    .innerJoin(usersTable, eq(usersTable.id, userAvatarsTable.userId))
    .where(and(inArray(userAvatarsTable.userId, userIds), mayBeShownToMembers()))

  return new Map(rows.map((row) => [row.userId, row.updatedAt]))
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

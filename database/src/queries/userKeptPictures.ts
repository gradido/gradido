// AI-GENERATED — not an architecture reference
import { and, asc, count, eq, ne, or } from 'drizzle-orm'
import { Result } from 'shared'
import { drizzleDb } from '../AppDatabase'
import { DBNotFoundError } from '../errorTypes'
import { UserKeptPictureInsert, userKeptPicturesTable } from '../schemas/drizzle.schema'

/**
 * The person a member's own picture is of (migration 0171): their community and gradido id, in
 * lower case as the rows keep them. The columns compare without regard to case
 * (utf8mb4_unicode_ci): another spelling would still find the row.
 */
export interface UserKeptPictureSubject {
  communityUuid: string
  gradidoId: string
}

const UserKeptPictureNotFound = (userId: number) =>
  new DBNotFoundError('user_kept_pictures', `userId = ${userId} and the person asked about`)

const isPictureOf = (subject: UserKeptPictureSubject) =>
  and(
    eq(userKeptPicturesTable.subjectCommunityUuid, subject.communityUuid),
    eq(userKeptPicturesTable.subjectGradidoId, subject.gradidoId),
  )

/**
 * WHO the member keeps a picture of, without the pictures: the two key columns only, so that the
 * wallet can know whom to wait for before the pictures come -- a list of a picture table names the
 * columns beside the picture and never the picture.
 *
 * Ordered by the key, as the pictures are.
 */
export async function dbSelectUserKeptPicturePairs(
  userId: number,
): Promise<{ subjectCommunityUuid: string; subjectGradidoId: string }[]> {
  return drizzleDb()
    .select({
      subjectCommunityUuid: userKeptPicturesTable.subjectCommunityUuid,
      subjectGradidoId: userKeptPicturesTable.subjectGradidoId,
    })
    .from(userKeptPicturesTable)
    .where(eq(userKeptPicturesTable.userId, userId))
    .orderBy(
      asc(userKeptPicturesTable.subjectCommunityUuid),
      asc(userKeptPicturesTable.subjectGradidoId),
    )
}

/**
 * Every picture the member keeps, in the small rendition, for the lists of their wallet. One query
 * over the member's rows -- the primary key begins with `user_id` -- and without the full
 * rendition, which is about ten times the size and is asked for one at a time.
 *
 * Ordered by the key, so that two reads give the same list.
 */
export async function dbSelectUserKeptPicturesSmall(
  userId: number,
): Promise<{ subjectCommunityUuid: string; subjectGradidoId: string; pictureSmall: Buffer }[]> {
  return drizzleDb()
    .select({
      subjectCommunityUuid: userKeptPicturesTable.subjectCommunityUuid,
      subjectGradidoId: userKeptPicturesTable.subjectGradidoId,
      pictureSmall: userKeptPicturesTable.pictureSmall,
    })
    .from(userKeptPicturesTable)
    .where(eq(userKeptPicturesTable.userId, userId))
    .orderBy(
      asc(userKeptPicturesTable.subjectCommunityUuid),
      asc(userKeptPicturesTable.subjectGradidoId),
    )
}

/** The full rendition of the member's picture of this person, for the enlarged view. */
export async function dbSelectUserKeptPictureFull(
  userId: number,
  subject: UserKeptPictureSubject,
): Promise<Result<Buffer, DBNotFoundError>> {
  const rows = await drizzleDb()
    .select({ pictureFull: userKeptPicturesTable.pictureFull })
    .from(userKeptPicturesTable)
    .where(and(eq(userKeptPicturesTable.userId, userId), isPictureOf(subject)))
    .limit(1)
  const row = rows.at(0)
  return row
    ? { success: true, value: row.pictureFull }
    : { success: false, error: UserKeptPictureNotFound(userId) }
}

/**
 * How many pictures the member keeps of OTHER people than this one: what a new picture of this
 * person is counted against. Replacing the picture of somebody already kept adds nothing, so it
 * is not counted here.
 */
export async function dbCountUserKeptPicturesBesides(
  userId: number,
  subject: UserKeptPictureSubject,
): Promise<number> {
  const rows = await drizzleDb()
    .select({ kept: count() })
    .from(userKeptPicturesTable)
    .where(
      and(
        eq(userKeptPicturesTable.userId, userId),
        or(
          ne(userKeptPicturesTable.subjectCommunityUuid, subject.communityUuid),
          ne(userKeptPicturesTable.subjectGradidoId, subject.gradidoId),
        ),
      ),
    )
  return rows[0]?.kept ?? 0
}

/**
 * Sets the picture, replacing the one before: one statement, and the primary key decides whether
 * the row is new. Both renditions in one write -- they come from one crop.
 */
export async function dbUpsertUserKeptPicture(row: UserKeptPictureInsert): Promise<void> {
  await drizzleDb()
    .insert(userKeptPicturesTable)
    .values(row)
    .onDuplicateKeyUpdate({
      set: {
        pictureSmall: row.pictureSmall,
        pictureFull: row.pictureFull,
        mimeType: row.mimeType,
        updatedAt: new Date(),
      },
    })
}

/**
 * Takes the picture away. Where there was none, nothing happens -- the member's wish is met
 * either way.
 */
export async function dbDeleteUserKeptPicture(
  userId: number,
  subject: UserKeptPictureSubject,
): Promise<void> {
  await drizzleDb()
    .delete(userKeptPicturesTable)
    .where(and(eq(userKeptPicturesTable.userId, userId), isPictureOf(subject)))
}

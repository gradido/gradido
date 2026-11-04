// AI-GENERATED — not an architecture reference
import { and, asc, eq } from 'drizzle-orm'
import { drizzleDb } from '../AppDatabase'
import { UserNoteSelect, UserNoteSubjectKind, userNotesTable } from '../schemas/drizzle.schema'

/**
 * What a member's own note is about, as the table names it (migration 0167): a person by their
 * community and gradido id, a group by its uuid with the community ''.
 *
 * The caller hands it over in lower case, as the rows keep it. The columns compare without
 * regard to case (utf8mb4_unicode_ci): another spelling would still find the row.
 */
export interface UserNoteSubject {
  kind: UserNoteSubjectKind
  communityUuid: string
  uuid: string
}

const isNoteOf = (userId: number, subject: UserNoteSubject) =>
  and(
    eq(userNotesTable.userId, userId),
    eq(userNotesTable.subjectKind, subject.kind),
    eq(userNotesTable.subjectCommunityUuid, subject.communityUuid),
    eq(userNotesTable.subjectUuid, subject.uuid),
  )

/**
 * The member's note on this subject, or null where they keep none.
 *
 * Plain on purpose: no note is an answer, not a failure (AGENTS.md, "functions that always
 * succeed on valid input").
 */
export async function dbSelectUserNote(
  userId: number,
  subject: UserNoteSubject,
): Promise<string | null> {
  const rows = await drizzleDb()
    .select({ note: userNotesTable.note })
    .from(userNotesTable)
    .where(isNoteOf(userId, subject))
    .limit(1)
  return rows[0]?.note ?? null
}

/**
 * Every note the member keeps, for the search of the contacts page: it finds a person or a group
 * by the words of their note as well. One query over the member's rows -- the primary key begins
 * with `user_id`.
 *
 * Ordered by the key, so that two reads give the same list.
 */
export async function dbSelectUserNotesByUserId(userId: number): Promise<UserNoteSelect[]> {
  return drizzleDb()
    .select()
    .from(userNotesTable)
    .where(eq(userNotesTable.userId, userId))
    .orderBy(
      asc(userNotesTable.subjectKind),
      asc(userNotesTable.subjectCommunityUuid),
      asc(userNotesTable.subjectUuid),
    )
}

/**
 * Writes the note, replacing the one before: one statement, and the primary key decides whether
 * the row is new.
 */
export async function dbUpsertUserNote(
  userId: number,
  subject: UserNoteSubject,
  note: string,
): Promise<void> {
  await drizzleDb()
    .insert(userNotesTable)
    .values({
      userId,
      subjectKind: subject.kind,
      subjectCommunityUuid: subject.communityUuid,
      subjectUuid: subject.uuid,
      note,
    })
    .onDuplicateKeyUpdate({ set: { note } })
}

/**
 * Takes the note away: an emptied note is no row. Where there was none, nothing happens -- the
 * member's wish is met either way.
 */
export async function dbDeleteUserNote(userId: number, subject: UserNoteSubject): Promise<void> {
  await drizzleDb().delete(userNotesTable).where(isNoteOf(userId, subject))
}

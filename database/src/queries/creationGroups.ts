// AI-GENERATED — not an architecture reference
import { and, asc, desc, eq, inArray, isNotNull, or } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { Result } from 'shared'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { DBDuplicateEntryError, DBInsertFailed, isDuplicateEntry } from '../errorTypes'
import {
  CreationGroupInsert,
  CreationGroupSelect,
  contributionCreationGroupsTable,
  contributionsTable,
  creationGroupsTable,
  userCreationGroupsTable,
} from '../schemas/drizzle.schema'

/** A creation group as a member's request names it (SUA-015): its row number, tag and name. */
export type CreationGroupRef = {
  id: number
  tag: string
  name: string | null
}
export type CreationGroupWithoutDates = Omit<CreationGroupSelect, 'createdAt' | 'updatedAt'>

/**
 * The group with this tag, or null where the community has none. The column compares without
 * regard to case, as its unique key does; the answer carries the tag as it is stored.
 */
export async function dbSelectCreationGroupByTag(tag: string): Promise<CreationGroupRef | null> {
  const [group] = await drizzleDb()
    .select({
      id: creationGroupsTable.id,
      tag: creationGroupsTable.tag,
      name: creationGroupsTable.name,
    })
    .from(creationGroupsTable)
    .where(eq(creationGroupsTable.tag, tag))
    .limit(1)
  return group ?? null
}

/**
 * Which of these row numbers the community has a group for ("Meine Gruppen", MG1: a choice may name
 * only groups there are). An empty list asks nothing.
 */
export async function dbSelectCreationGroupIdsIn(ids: number[]): Promise<number[]> {
  if (ids.length === 0) {
    return []
  }
  const rows = await drizzleDb()
    .select({ id: creationGroupsTable.id })
    .from(creationGroupsTable)
    .where(inArray(creationGroupsTable.id, ids))
  return rows.map(({ id }) => id)
}

/** Every group of the community, by tag. */
export async function dbSelectCreationGroups(): Promise<CreationGroupSelect[]> {
  return drizzleDb().select().from(creationGroupsTable).orderBy(asc(creationGroupsTable.tag))
}

export async function dbSelectCreationGroupById(id: number): Promise<CreationGroupSelect | null> {
  const [group] = await drizzleDb()
    .select()
    .from(creationGroupsTable)
    .where(eq(creationGroupsTable.id, id))
    .limit(1)
  return group ?? null
}

/** The groups with these row numbers, in no particular order. An empty list asks nothing. */
export async function dbSelectCreationGroupsByIds(ids: number[]): Promise<CreationGroupSelect[]> {
  if (ids.length === 0) {
    return []
  }
  return drizzleDb().select().from(creationGroupsTable).where(inArray(creationGroupsTable.id, ids))
}

/**
 * The groups with these tags, compared without regard to case or accents as the column does.
 * An empty list asks nothing.
 */
export async function dbSelectCreationGroupsByTags(tags: string[]): Promise<CreationGroupSelect[]> {
  if (tags.length === 0) {
    return []
  }
  return drizzleDb()
    .select()
    .from(creationGroupsTable)
    .where(inArray(creationGroupsTable.tag, tags))
}

/** Adds a group and answers its row number; a tag already taken (without regard to case or accents) is a DBDuplicateEntryError. */
export async function dbInsertCreationGroup(
  values: CreationGroupInsert,
): Promise<Result<number, DBInsertFailed<CreationGroupInsert> | DBDuplicateEntryError>> {
  try {
    const [result] = await drizzleDb().insert(creationGroupsTable).values(values)
    if (result && result.affectedRows === 1) {
      return { success: true, value: result.insertId }
    }
    return {
      success: false,
      error: new DBInsertFailed<CreationGroupInsert>('creation_groups', values),
    }
  } catch (error) {
    if (isDuplicateEntry(error)) {
      return {
        success: false,
        error: new DBDuplicateEntryError('creation_groups', 'tag', values.tag),
      }
    }
    throw error
  }
}

/** Changes the given columns of one group. Nothing given writes nothing. */
export async function dbUpdateCreationGroup(
  id: number,
  values: Pick<
    Partial<CreationGroupInsert>,
    'tag' | 'name' | 'hashtagsAdoptedAt' | 'hashtagsAdoptedCount'
  >,
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<void> {
  if (Object.keys(values).length === 0) {
    return
  }
  await tx.update(creationGroupsTable).set(values).where(eq(creationGroupsTable.id, id))
}

/** A member's personal list, as the group rows, in list order (the first is the main group). */
export async function dbSelectUserCreationGroups(userId: number): Promise<CreationGroupSelect[]> {
  const rows = await drizzleDb()
    .select({ group: creationGroupsTable })
    .from(userCreationGroupsTable)
    .innerJoin(
      creationGroupsTable,
      eq(creationGroupsTable.id, userCreationGroupsTable.creationGroupId),
    )
    .where(eq(userCreationGroupsTable.userId, userId))
    .orderBy(asc(userCreationGroupsTable.sortOrder), asc(userCreationGroupsTable.id))
  return rows.map(({ group }) => group)
}

/**
 * Replaces a member's personal list with these groups, in this order. One transaction: the
 * delete alone is destructive, and two calls arriving together must not interleave.
 * The ids must be distinct (uniq_user_creation_group).
 */
export async function dbReplaceUserCreationGroups(
  userId: number,
  creationGroupIds: number[],
): Promise<void> {
  await drizzleDb().transaction(async (tx) => {
    await tx.delete(userCreationGroupsTable).where(eq(userCreationGroupsTable.userId, userId))
    if (creationGroupIds.length > 0) {
      await tx.insert(userCreationGroupsTable).values(
        creationGroupIds.map((creationGroupId, sortOrder) => ({
          userId,
          creationGroupId,
          sortOrder,
        })),
      )
    }
  })
}

/**
 * The member's newest contribution that made a statement about its group: linked to one, or
 * stamped creation_groups_set_at for "no group". Null where none did; `group: null` where the
 * newest statement is "no group". Deleted contributions count. One row, found over
 * idx_contributions_user_created; a contribution in several groups answers the first by tag.
 */
export async function dbSelectNewestCreationGroupStatement(
  userId: number,
): Promise<{ group: CreationGroupSelect | null } | null> {
  const [row] = await drizzleDb()
    .select({ group: creationGroupsTable })
    .from(contributionsTable)
    .leftJoin(
      contributionCreationGroupsTable,
      eq(contributionCreationGroupsTable.contributionId, contributionsTable.id),
    )
    .leftJoin(
      creationGroupsTable,
      eq(creationGroupsTable.id, contributionCreationGroupsTable.creationGroupId),
    )
    .where(
      and(
        eq(contributionsTable.userId, userId),
        or(
          isNotNull(contributionsTable.creationGroupsSetAt),
          isNotNull(contributionCreationGroupsTable.id),
        ),
      ),
    )
    .orderBy(
      desc(contributionsTable.createdAt),
      desc(contributionsTable.id),
      asc(creationGroupsTable.tag),
    )
    .limit(1)
  return row ?? null
}

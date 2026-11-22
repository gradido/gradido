import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { VoidResult } from 'shared'
import { DrizzleTransaction, drizzleDb } from '../AppDatabase'
import { ASSIGNABLE_ROLE_NAMES, RoleNames } from '../enum'
import { DBNotFoundError } from '../errorTypes'
import {
  UserRoleInsert,
  userContactsTable,
  userRolesTable,
  usersTable,
} from '../schemas/drizzle.schema'

/**
 * A member with a role, as a mail to the moderation needs them: their role, their scope and their
 * tick as stored (`visibleCreationGroups`, the JSON text describeModeratorCreationGroups reads;
 * `supportDuty`, which roleOfHolder reads), their name and language for the mail, and their
 * confirmed address in force.
 */
export interface RoleHolderWithContact {
  userId: number
  role: string
  visibleCreationGroups: string | null
  supportDuty: boolean
  /** "Meine Gruppen" of the support (MG2b), its JSON text: whether they handle none (MG5) */
  handledSupportGroups: string | null
  firstName: string | null
  lastName: string | null
  language: string
  email: string
}

/**
 * Everybody with a role who can be mailed from here (Support-Anfragen K5, the mail about a new
 * request to the moderation): every row with one of ASSIGNABLE_ROLE_NAMES -- the column is free
 * text, and rows with USER existed --, its member not deleted and of this community, their
 * address in force not deleted and confirmed. By the member's number.
 *
 * All rows of the table on purpose, and no filter by group: only members with a role have a
 * row, and who sees which request stands as JSON text in it, which only the backend reads.
 */
export async function dbSelectRoleHoldersWithContact(): Promise<RoleHolderWithContact[]> {
  return drizzleDb()
    .select({
      userId: userRolesTable.userId,
      role: userRolesTable.role,
      visibleCreationGroups: userRolesTable.visibleCreationGroups,
      supportDuty: userRolesTable.supportDuty,
      handledSupportGroups: userRolesTable.handledSupportGroups,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      language: usersTable.language,
      email: userContactsTable.email,
    })
    .from(userRolesTable)
    .innerJoin(usersTable, eq(usersTable.id, userRolesTable.userId))
    .innerJoin(userContactsTable, eq(userContactsTable.id, usersTable.emailId))
    .where(
      and(
        inArray(userRolesTable.role, ASSIGNABLE_ROLE_NAMES),
        isNull(usersTable.deletedAt),
        eq(usersTable.foreign, false),
        isNull(userContactsTable.deletedAt),
        eq(userContactsTable.emailChecked, true),
      ),
    )
    .orderBy(asc(userRolesTable.userId))
}

/**
 * Give the member this role: the one row they have is changed, or their first is written.
 *
 * An upsert, because "one member, one role" is the unique key on `user_id` (migration
 * 0135) and a read-then-write from the caller would only reintroduce the race the key
 * removes: two admins granting a role to the same member at the same moment both saw no
 * row, both inserted, and the member ended up with two -- which the readers then
 * interpreted in three different ways. Now the second write updates the first.
 *
 * ⛔ `visible_creation_groups` and `support_duty` are left as they are on a change. That is what
 * setUserRole did before this query existed (it saved `userRoles[0]` with a new role and nothing
 * else): scope and tick go along from moderator to KI-moderator and back, also by way of
 * administrator. Removing a role is what resets them -- see deleteUserRole.
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
 * Sets or takes away the tick "may handle support requests" (Support-Anfragen K6) on the member's
 * role row -- where that row holds one of the two moderator kinds, and the role is the condition
 * of the very statement: a role taken away or turned into ADMIN in the meantime gets nothing
 * written, and answers like a missing row. A tick set twice is found the second time too (the
 * pool counts the rows found, not the rows changed: mysql2 connects with FOUND_ROWS).
 */
export async function dbUpdateUserRoleSupportDuty(
  userId: number,
  supportDuty: boolean,
): Promise<VoidResult<DBNotFoundError>> {
  const [result] = await drizzleDb()
    .update(userRolesTable)
    .set({ supportDuty, updatedAt: new Date() })
    .where(
      and(
        eq(userRolesTable.userId, userId),
        inArray(userRolesTable.role, [RoleNames.MODERATOR, RoleNames.MODERATOR_AI]),
      ),
    )
  return result.affectedRows === 1
    ? { success: true }
    : {
        success: false,
        error: new DBNotFoundError('user_roles', `user_id = ${userId} with a moderator role`),
      }
}

/** "Meine Gruppen" as the role row stores it: one JSON text per column, null where nothing is chosen. */
export interface StoredHandledGroups {
  /** the groups whose creations the holder handles (MG1), handled_creation_groups */
  creation: string | null
  /** the groups whose support requests the holder handles (MG2b), handled_support_groups */
  support: string | null
}

/**
 * Sets "Meine Gruppen" on the member's role row, both columns in one statement -- the JSON texts
 * handledCreationGroupsOf reads in the backend -- or clears a column with null. Where that row holds
 * one of ASSIGNABLE_ROLE_NAMES, the role the condition of the very statement: a role taken away in
 * the meantime gets nothing written, and answers like a missing row. Whether a choice counts under
 * the role of the moment the backend decides on reading, so a role change needs nothing here. A
 * choice saved twice is found the second time too (FOUND_ROWS, see dbUpdateUserRoleSupportDuty).
 */
export async function dbUpdateUserRoleHandledGroups(
  userId: number,
  { creation, support }: StoredHandledGroups,
): Promise<VoidResult<DBNotFoundError>> {
  const [result] = await drizzleDb()
    .update(userRolesTable)
    .set({ handledCreationGroups: creation, handledSupportGroups: support, updatedAt: new Date() })
    .where(
      and(eq(userRolesTable.userId, userId), inArray(userRolesTable.role, ASSIGNABLE_ROLE_NAMES)),
    )
  return result.affectedRows === 1
    ? { success: true }
    : {
        success: false,
        error: new DBNotFoundError('user_roles', `user_id = ${userId} with a role`),
      }
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

// One statement for all the rows it is given
export async function dbInsertUserRoles(
  userRoles: UserRoleInsert[],
  tx: DrizzleTransaction | MySql2Database = drizzleDb(),
): Promise<void> {
  if (userRoles.length === 0) {
    return
  }
  await tx.insert(userRolesTable).values(userRoles)
}

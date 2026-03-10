import { and, asc, eq, isNotNull, isNull, or, sql } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import * as v from 'valibot'
import { communitiesTable, eventsTable, userRolesTable, usersTable } from './drizzle.schema'
import { CommunityDb, communityDbSchema, UserDb, userDbSchema } from './valibot.schema'

export const contributionLinkModerators = new Map<number, UserDb>()
export const adminUsers = new Map<string, UserDb>()

export async function loadContributionLinkModeratorCache(db: MySql2Database): Promise<void> {
  const result = await db
    .select({
      event: eventsTable,
      user: usersTable,
    })
    .from(eventsTable)
    .innerJoin(usersTable, eq(eventsTable.actingUserId, usersTable.id))
    .where(eq(eventsTable.type, 'ADMIN_CONTRIBUTION_LINK_CREATE'))
    .orderBy(asc(eventsTable.id))

  result.map((row: any) => {
    contributionLinkModerators.set(
      row.event.involvedContributionLinkId,
      v.parse(userDbSchema, row.user),
    )
  })
}

export async function loadAdminUsersCache(db: MySql2Database): Promise<void> {
  const result = await db
    .select({
      user: usersTable,
    })
    .from(userRolesTable)
    .where(eq(userRolesTable.role, 'ADMIN'))
    .innerJoin(usersTable, eq(userRolesTable.userId, usersTable.id))

  result.map((row: any) => {
    adminUsers.set(row.gradidoId, v.parse(userDbSchema, row.user))
  })
}

// queries
export async function loadCommunities(db: MySql2Database): Promise<CommunityDb[]> {
  const result = await db
    .select({
      id: communitiesTable.id,
      foreign: communitiesTable.foreign,
      communityUuid: communitiesTable.communityUuid,
      name: communitiesTable.name,
      creationDate: communitiesTable.creationDate,
      userMinCreatedAt: sql`MIN(${usersTable.createdAt})`,
    })
    .from(communitiesTable)
    .innerJoin(usersTable, eq(communitiesTable.communityUuid, usersTable.communityUuid))
    .where(
      and(isNotNull(communitiesTable.communityUuid), sql`${usersTable.createdAt} > '2000-01-01'`),
    )
    .orderBy(asc(communitiesTable.id))
    .groupBy(communitiesTable.communityUuid)

  return result.map((row: any) => {
    return v.parse(communityDbSchema, row)
  })
}

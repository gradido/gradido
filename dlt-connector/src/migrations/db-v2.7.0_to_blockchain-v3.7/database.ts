import { asc, eq, isNotNull, sql } from 'drizzle-orm'
import { MySql2Database } from 'drizzle-orm/mysql2'
import * as v from 'valibot'
import {
  communitiesTable,
  eventsTable,
  userRolesTable,
  usersTable
} from './drizzle.schema'
import {
  CommunityDb,
  UserDb,
  communityDbSchema,
  userDbSchema,
} from './valibot.schema'

export const contributionLinkModerators = new Map<number, UserDb>()
export const adminUsers = new Map<string, UserDb>()

export async function loadContributionLinkModeratorCache(db: MySql2Database): Promise<void> {
  const result = await db
    .select({
      event: eventsTable,
      user: usersTable,
    })
    .from(eventsTable)
    .leftJoin(usersTable, eq(eventsTable.actingUserId, usersTable.id))
    .where(eq(eventsTable.type, 'ADMIN_CONTRIBUTION_LINK_CREATE'))
    .orderBy(asc(eventsTable.id))

  result.map((row: any) => {
    contributionLinkModerators.set(row.event.involvedContributionLinkId, v.parse(userDbSchema, row.user))
  })
}

export async function loadAdminUsersCache(db: MySql2Database): Promise<void> {
  const result = await db
    .select({
      user: usersTable,
    })
    .from(userRolesTable)
    .where(eq(userRolesTable.role, 'ADMIN'))
    .leftJoin(usersTable, eq(userRolesTable.userId, usersTable.id))

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
    .leftJoin(usersTable, eq(communitiesTable.communityUuid, usersTable.communityUuid))
    .where(isNotNull(communitiesTable.communityUuid))
    .orderBy(asc(communitiesTable.id))
    .groupBy(communitiesTable.communityUuid)

  return result.map((row: any) => {
    return v.parse(communityDbSchema, row)
  })
}

export async function loadUserByGradidoId(db: MySql2Database, gradidoId: string): Promise<UserDb | null> {
  const result = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.gradidoId, gradidoId))
    .limit(1)

  return result.length ? v.parse(userDbSchema, result[0]) : null
}


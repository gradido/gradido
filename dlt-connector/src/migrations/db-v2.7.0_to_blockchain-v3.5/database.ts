import { and, asc, count, eq, gt, inArray, isNotNull, isNull, lt, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import {
  communitiesTable,
  contributionsTable,  
  eventsTable,
  TransactionSelect,
  transactionLinksTable,
  transactionSelectSchema,
  transactionsTable,
  UserSelect,
  userRolesTable,
  userSelectSchema,
  usersTable
} from './drizzle.schema'
import { TransactionTypeId } from './TransactionTypeId'
import {
  CommunityDb,
  CreatedUserDb,
  communityDbSchema,
  createdUserDbSchema,
  TransactionDb,
  TransactionLinkDb,
  transactionDbSchema,
  transactionLinkDbSchema,
} from './valibot.schema'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.6.blockchain`,
)

export const contributionLinkModerators = new Map<number, CreatedUserDb>()
export const adminUsers = new Map<string, CreatedUserDb>()
const transactionIdSet = new Set<number>()

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
    contributionLinkModerators.set(row.event.involvedContributionLinkId, v.parse(createdUserDbSchema, row.user))
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
    adminUsers.set(row.gradidoId, v.parse(createdUserDbSchema, row.user))
  })
}

// queries
export async function loadCommunities(db: MySql2Database): Promise<CommunityDb[]> {
  const result = await db
    .select({
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

  const communityNames = new Set<string>()
  return result.map((row: any) => {
    let alias = row.name
    if (communityNames.has(row.name)) {
      alias = row.community_uuid
    } else {
      communityNames.add(row.name)
    }
    return v.parse(communityDbSchema, {
      ...row,
      uniqueAlias: alias,
    })
  })
}

export async function loadUsers(
  db: MySql2Database,
  offset: number,
  count: number,
): Promise<CreatedUserDb[]> {
  const result = await db
    .select()
    .from(usersTable)
    .orderBy(asc(usersTable.createdAt), asc(usersTable.id))
    .limit(count)
    .offset(offset)

  return result.map((row: any) => {
    return v.parse(createdUserDbSchema, row)
  })
}

export async function loadUserByGradidoId(db: MySql2Database, gradidoId: string): Promise<CreatedUserDb | null> {
  const result = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.gradidoId, gradidoId))
    .limit(1)

  return result.length ? v.parse(createdUserDbSchema, result[0]) : null
}

export async function loadTransactions(
  db: MySql2Database,
  offset: number,
  count: number,
): Promise<TransactionDb[]> {
  const linkedUsers = alias(usersTable, 'linkedUser')
  const linkedTransactions = alias(transactionsTable, 'linkedTransaction')

  const result = await db
    .select({
      transaction: transactionsTable,
      user: usersTable,
      linkedUser: linkedUsers,
      transactionLink: {
        id: transactionLinksTable.id,
        code: transactionLinksTable.code
      },
      linkedUserBalance: linkedTransactions.balance,
    })
    .from(transactionsTable)
    .where(
      and(
        inArray(transactionsTable.typeId, [TransactionTypeId.CREATION, TransactionTypeId.RECEIVE]),
        isNotNull(transactionsTable.linkedUserId),
        eq(usersTable.foreign, 0)
      )
    )
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .leftJoin(linkedUsers, eq(transactionsTable.linkedUserId, linkedUsers.id))
    .leftJoin(
      transactionLinksTable,
      eq(transactionsTable.transactionLinkId, transactionLinksTable.id),
    )
    .leftJoin(linkedTransactions, eq(transactionsTable.linkedTransactionId, linkedTransactions.id))
    .orderBy(asc(transactionsTable.balanceDate), asc(transactionsTable.id))
    .limit(count)
    .offset(offset)

  return result.map((row: any) => {
    // console.log(row)
    try {
      /*if (transactionIdSet.has(row.transaction.id)) {
        throw new Error(`transaction ${row.transaction.id} already loaded`)
      }
      transactionIdSet.add(row.transaction.id)
      */ 
      return v.parse(transactionDbSchema, {
        ...row.transaction,
        transactionLinkCode: row.transactionLink ? row.transactionLink.code : null,
        user: row.user,
        linkedUser: row.linkedUser,
        linkedUserBalance: row.linkedUserBalance,
      })
    } catch (e) {
      logger.error(`table row: ${JSON.stringify(row, null, 2)}`)
      if (e instanceof v.ValiError) {
        logger.error(v.flatten(e.issues))
      }
      throw e
    }
  })
}

export async function loadInvalidContributionTransactions(
  db: MySql2Database,
  offset: number,
  count: number,
): Promise<{ id: number, balanceDate: Date }[]> {
  const result = await db
    .select({
      id: transactionsTable.id,
      balanceDate: transactionsTable.balanceDate,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.typeId, TransactionTypeId.CREATION),
        sql`NOT EXISTS (SELECT 1 FROM contributions WHERE contributions.transaction_id = transactions.id)`,
      )
    )
    .orderBy(asc(transactionsTable.balanceDate), asc(transactionsTable.id))
    .limit(count)
    .offset(offset)
  
  return result.map((row: any) => {
    return {
      id: row.id,
      balanceDate: new Date(row.balanceDate),
    }
  })
}

export async function loadDoubleLinkedTransactions(
  db: MySql2Database,
  offset: number,
  rowsCount: number,
): Promise<{ id: number, balanceDate: Date }[]> {
  const result = await db
    .select({
      id: transactionsTable.id,
      balanceDate: transactionsTable.balanceDate,
      transactionLinkId: transactionsTable.transactionLinkId,
      cnt: count(),
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.typeId, TransactionTypeId.RECEIVE),
        isNotNull(transactionsTable.transactionLinkId),
      )
    )
    .groupBy(transactionsTable.transactionLinkId)
    .having(gt(count(), 1))
    .orderBy(asc(transactionsTable.balanceDate), asc(transactionsTable.id))
    .limit(rowsCount)
    .offset(offset)

  // logger.info(`loadDoubleLinkedTransactions ${result.length}: ${timeUsed.string()}`)
  
  return result.map((row: any) => {
    return {
      id: row.transactionLinkId,
      balanceDate: new Date(row.balanceDate),
    }
  })
}

export async function loadContributionLinkTransactions(
  db: MySql2Database,
  offset: number,
  count: number,
): Promise<{ transaction: TransactionSelect, user: UserSelect, contributionLinkId: number }[]> {
  const result = await db
    .select({
      transaction: transactionsTable,
      user: usersTable,
      contributionLinkId: contributionsTable.contributionLinkId,
    })
    .from(contributionsTable)
    .where(
      and(
        isNotNull(contributionsTable.contributionLinkId),
        isNull(transactionsTable.linkedUserId)
      )
    )
    .leftJoin(transactionsTable, eq(contributionsTable.transactionId, transactionsTable.id))
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .orderBy(asc(transactionsTable.balanceDate), asc(transactionsTable.id))
    .limit(count)
    .offset(offset)

  return result.map((row: any) => {
    if (transactionIdSet.has(row.transaction.id)) {
        throw new Error(`transaction ${row.transaction.id} already loaded`)
      }
      transactionIdSet.add(row.transaction.id)
    return {
      transaction: v.parse(transactionSelectSchema, row.transaction),
      user: v.parse(userSelectSchema, row.user),
      contributionLinkId: row.contributionLinkId,
    }
  })
}

export async function loadTransactionLinks(
  db: MySql2Database,
  offset: number,
  count: number,
): Promise<TransactionLinkDb[]> {
  const result = await db
    .select()
    .from(transactionLinksTable)
    .leftJoin(usersTable, eq(transactionLinksTable.userId, usersTable.id))
    .orderBy(asc(transactionLinksTable.createdAt), asc(transactionLinksTable.id))
    .limit(count)
    .offset(offset)

  return result.map((row: any) => {
    return v.parse(transactionLinkDbSchema, {
      ...row.transaction_links,
      user: row.users,
    })
  })
}

export async function loadDeletedTransactionLinks(
  db: MySql2Database,
  offset: number,
  count: number,
): Promise<TransactionDb[]> {
  const result = await db
    .select()
    .from(transactionLinksTable)
    .leftJoin(usersTable, eq(transactionLinksTable.userId, usersTable.id))
    .where(and(
      isNotNull(transactionLinksTable.deletedAt),
      lt(transactionLinksTable.deletedAt, transactionLinksTable.validUntil)
    ))
    .orderBy(asc(transactionLinksTable.deletedAt), asc(transactionLinksTable.id))
    .limit(count)
    .offset(offset)

  return result.map((row: any) => {
    return v.parse(transactionDbSchema, {
      id: row.transaction_links.id,
      typeId: TransactionTypeId.RECEIVE,
      amount: row.transaction_links.amount,
      balanceDate: new Date(row.transaction_links.deletedAt),
      memo: row.transaction_links.memo,
      transactionLinkCode: row.transaction_links.code,
      user: row.users,
      linkedUser: row.users,
    })
  })
}

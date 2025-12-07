import { and, asc, eq, inArray, isNotNull, lt, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { GradidoUnit } from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import {
  communitiesTable,
  contributionsTable,
  eventsTable,
  transactionLinksTable,
  transactionsTable,
  usersTable,
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

const contributionLinkModerators = new Map<number, CreatedUserDb>()

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

export async function loadTransactions(
  db: MySql2Database,
  offset: number,
  count: number,
): Promise<TransactionDb[]> {
  const linkedUsers = alias(usersTable, 'linkedUser')

  const result = await db
    .select({
      transaction: transactionsTable,
      user: usersTable,
      linkedUser: linkedUsers,
      transactionLink: transactionLinksTable,
    })
    .from(transactionsTable)
    .where(
      inArray(transactionsTable.typeId, [TransactionTypeId.CREATION, TransactionTypeId.RECEIVE]),
    )
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .leftJoin(linkedUsers, eq(transactionsTable.linkedUserId, linkedUsers.id))
    .leftJoin(
      transactionLinksTable,
      eq(transactionsTable.transactionLinkId, transactionLinksTable.id),
    )
    .orderBy(asc(transactionsTable.balanceDate), asc(transactionsTable.id))
    .limit(count)
    .offset(offset)

  return await Promise.all(result.map(async (row: any) => {
    // console.log(row)
    try {
      const user = v.parse(createdUserDbSchema, row.user)
      let linkedUser: CreatedUserDb | null | undefined = null
      if (!row.linkedUser) {
        const contribution = await db
          .select({contributionLinkId: contributionsTable.contributionLinkId})
          .from(contributionsTable)
          .where(eq(contributionsTable.transactionId, row.transaction.id))
          .limit(1)
        if (contribution && contribution.length > 0 && contribution[0].contributionLinkId) {
          linkedUser = contributionLinkModerators.get(contribution[0].contributionLinkId)
        }
      } else {
        linkedUser = v.parse(createdUserDbSchema, row.linkedUser)
      }
      if (!linkedUser) {
        throw new Error(`linked user not found for transaction ${row.transaction.id}`)
      }
      
      // check for consistent data beforehand
      const balanceDate = new Date(row.transaction.balanceDate)
      if (
        user.createdAt.getTime() > balanceDate.getTime() ||
        linkedUser?.createdAt.getTime() > balanceDate.getTime()
      ) {
        logger.error(`table row: `, row)
        throw new Error(
          'at least one user was created after transaction balance date, logic error!',
        )
      }

      let amount = GradidoUnit.fromString(row.transaction.amount)
      if (row.transaction.typeId === TransactionTypeId.SEND) {
        amount = amount.mul(new GradidoUnit(-1))
      }
      return v.parse(transactionDbSchema, {
        ...row.transaction,
        transactionLinkCode: row.transactionLink ? row.transactionLink.code : null,
        user,
        linkedUser,
      })
    } catch (e) {
      logger.error(`table row: ${JSON.stringify(row, null, 2)}`)
      if (e instanceof v.ValiError) {
        logger.error(v.flatten(e.issues))
      }
      throw e
    }
  }))
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

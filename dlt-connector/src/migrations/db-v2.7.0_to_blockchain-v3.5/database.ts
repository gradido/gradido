import { asc, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'
import { MySql2Database } from 'drizzle-orm/mysql2'
import { GradidoUnit } from 'gradido-blockchain-js'
import { getLogger } from 'log4js'
import * as v from 'valibot'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import {
  communitiesTable,
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
    .orderBy(asc(usersTable.createdAt))
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
    .orderBy(asc(transactionsTable.balanceDate))
    .limit(count)
    .offset(offset)

  return result.map((row: any) => {
    // console.log(row)
    try {
      // check for consistent data beforehand
      const userCreatedAt = new Date(row.user.createdAt)
      const linkedUserCreatedAd = new Date(row.linkedUser.createdAt)
      const balanceDate = new Date(row.transaction.balanceDate)
      if (
        userCreatedAt.getTime() > balanceDate.getTime() ||
        linkedUserCreatedAd.getTime() > balanceDate.getTime()
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
        user: row.user,
        linkedUser: row.linkedUser,
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

export async function loadTransactionLinks(
  db: MySql2Database,
  offset: number,
  count: number,
): Promise<TransactionLinkDb[]> {
  const result = await db
    .select()
    .from(transactionLinksTable)
    .leftJoin(usersTable, eq(transactionLinksTable.userId, usersTable.id))
    .orderBy(asc(transactionLinksTable.createdAt))
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
    .where(isNotNull(transactionLinksTable.deletedAt))
    .orderBy(asc(transactionLinksTable.deletedAt))
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

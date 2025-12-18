import { sql } from 'drizzle-orm'
import {
  char,
  datetime,
  decimal,
  index,
  int,
  mysqlTable,
  tinyint,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core'
import { createSelectSchema } from 'drizzle-valibot'
import * as v from 'valibot'

// use only fields needed in the migration, after update the rest of the project, import database instead
export const communitiesTable = mysqlTable(
  'communities',
  {
    id: int().autoincrement().notNull(),
    foreign: tinyint().default(1).notNull(),
    communityUuid: char('community_uuid', { length: 36 }).default(sql`NULL`),
    name: varchar({ length: 40 }).default(sql`NULL`),
    creationDate: datetime('creation_date', { mode: 'string', fsp: 3 }).default(sql`NULL`),
  },
  (table) => [unique('uuid_key').on(table.communityUuid)],
)

export const contributionsTable = mysqlTable('contributions', {
	id: int().autoincrement().notNull(),
	contributionLinkId: int('contribution_link_id').default(sql`NULL`),
	confirmedBy: int('confirmed_by').default(sql`NULL`),
	confirmedAt: datetime('confirmed_at', { mode: 'string'}).default(sql`NULL`),
	deletedAt: datetime('deleted_at', { mode: 'string'}).default(sql`NULL`),
	transactionId: int('transaction_id').default(sql`NULL`),
})

export const eventsTable = mysqlTable('events', {
	id: int().autoincrement().notNull(),
	type: varchar({ length: 100 }).notNull(),
	actingUserId: int('acting_user_id').notNull(),
	involvedContributionLinkId: int('involved_contribution_link_id').default(sql`NULL`),
})

export const usersTable = mysqlTable(
  'users',
  {
    id: int().autoincrement().notNull(),
    foreign: tinyint().default(0).notNull(),
    gradidoId: char('gradido_id', { length: 36 }).notNull(),
    communityUuid: varchar('community_uuid', { length: 36 }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
  },
  (table) => [unique('uuid_key').on(table.gradidoId, table.communityUuid)],
)

export const userSelectSchema = createSelectSchema(usersTable)
export type UserSelect = v.InferOutput<typeof userSelectSchema>

export const userRolesTable = mysqlTable('user_roles', {
	id: int().autoincrement().notNull(),
	userId: int('user_id').notNull(),
	role: varchar({ length: 40 }).notNull(),
},
(table) => [
	index('user_id').on(table.userId),
])

export const transactionsTable = mysqlTable(
  'transactions',
  {
    id: int().autoincrement().notNull(),
    typeId: int('type_id').default(sql`NULL`),
    transactionLinkId: int('transaction_link_id').default(sql`NULL`),
    amount: decimal({ precision: 40, scale: 20 }).default(sql`NULL`),
    balance: decimal({ precision: 40, scale: 20 }).default(sql`NULL`),
    balanceDate: datetime('balance_date', { mode: 'string', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    memo: varchar({ length: 255 }).notNull(),
    creationDate: datetime('creation_date', { mode: 'string', fsp: 3 }).default(sql`NULL`),
    userId: int('user_id').notNull(),
    linkedUserId: int('linked_user_id').default(sql`NULL`),
    linkedTransactionId: int('linked_transaction_id').default(sql`NULL`),
  },
  (table) => [index('user_id').on(table.userId)],
)

export const transactionSelectSchema = createSelectSchema(transactionsTable)
export type TransactionSelect = v.InferOutput<typeof transactionSelectSchema>

export const transactionLinksTable = mysqlTable('transaction_links', {
  id: int().autoincrement().notNull(),
  userId: int().notNull(),
  amount: decimal({ precision: 40, scale: 20 }).notNull(),
  memo: varchar({ length: 255 }).notNull(),
  code: varchar({ length: 24 }).notNull(),
  createdAt: datetime({ mode: 'string' }).notNull(),
  deletedAt: datetime({ mode: 'string' }).default(sql`NULL`),
  validUntil: datetime({ mode: 'string' }).notNull(),
})

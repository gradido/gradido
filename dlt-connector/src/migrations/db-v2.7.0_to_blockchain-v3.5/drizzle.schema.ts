
import { mysqlTable, unique, int, varchar, char, datetime, tinyint, decimal, index } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'


// use only fields needed in the migration, after update the rest of the project, import database instead
export const communitiesTable = mysqlTable('communities', {
	foreign: tinyint().default(1).notNull(),
	communityUuid: char('community_uuid', { length: 36 }).default(sql`NULL`),
	name: varchar({ length: 40 }).default(sql`NULL`),
	creationDate: datetime('creation_date', { mode: 'string', fsp: 3 }).default(sql`NULL`),
},
(table) => [
	unique('uuid_key').on(table.communityUuid),
])


export const usersTable = mysqlTable('users', {
  id: int().autoincrement().notNull(),
  gradidoId: char('gradido_id', { length: 36 }).notNull(),
  communityUuid: varchar('community_uuid', { length: 36 }).default(sql`NULL`),
  createdAt: datetime('created_at', { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
},
(table) => [
  unique('uuid_key').on(table.gradidoId, table.communityUuid),
])

export const transactionsTable = mysqlTable('transactions', {
	id: int().autoincrement().notNull(),
	typeId: int("type_id").default(sql`NULL`),
	transactionLinkId: int("transaction_link_id").default(sql`NULL`),
	amount: decimal({ precision: 40, scale: 20 }).default(sql`NULL`),
	balanceDate: datetime("balance_date", { mode: 'string', fsp: 3 }).default(sql`current_timestamp(3)`).notNull(),
	memo: varchar({ length: 255 }).notNull(),
	creationDate: datetime("creation_date", { mode: 'string', fsp: 3 }).default(sql`NULL`),
	userId: int("user_id").notNull(),
	linkedUserId: int("linked_user_id").default(sql`NULL`),
},
(table) => [
	index("user_id").on(table.userId),
])


export const transactionLinksTable = mysqlTable('transaction_links', {
	id: int().autoincrement().notNull(),
  userId: int().notNull(),
	amount: decimal({ precision: 40, scale: 20 }).notNull(),
	memo: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 24 }).notNull(),
	createdAt: datetime({ mode: 'string'}).notNull(),
	deletedAt: datetime({ mode: 'string'}).default(sql`NULL`),
	validUntil: datetime({ mode: 'string'}).notNull(),
})

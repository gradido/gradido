import { sql } from 'drizzle-orm'
import {
  bigint,
  char,
  datetime,
  decimal,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

import { customGradidoUnit } from './customTypes'

export const contributionsTable = mysqlTable(
  'contributions',
  {
    id: int().autoincrement().notNull(),
    userId: int('user_id').default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'string' }).default(sql`NULL`),
    resubmissionAt: datetime('resubmission_at', { mode: 'string' }).default(sql`NULL`),
    contributionDate: datetime('contribution_date', { mode: 'string' }).default(sql`NULL`),
    memo: varchar({ length: 512 }).notNull(),
    amountLegacy: decimal('amount_legacy', { precision: 40, scale: 20, mode: 'string' }).default(
      sql`NULL`,
    ),
    amount: customGradidoUnit('amount_gdd4').default(sql`NULL`),
    moderatorId: int('moderator_id').default(sql`NULL`),
    contributionLinkId: int('contribution_link_id').default(sql`NULL`),
    confirmedBy: int('confirmed_by').default(sql`NULL`),
    confirmedAt: datetime('confirmed_at', { mode: 'string' }).default(sql`NULL`),
    deniedAt: datetime('denied_at', { mode: 'string' }).default(sql`NULL`),
    deniedBy: int('denied_by').default(sql`NULL`),
    type: varchar('contribution_type', { length: 12 }).default(sql`ADMIN`).notNull(),
    status: varchar('contribution_status', { length: 12 }).default(sql`PENDING`).notNull(),
    deletedAt: datetime('deleted_at', { mode: 'string' }).default(sql`NULL`),
    transactionId: int('transaction_id').default(sql`NULL`),
    updatedAt: datetime('updated_at', { mode: 'string' }).default(sql`NULL`),
    updatedBy: int('updated_by').default(sql`NULL`),
    deletedBy: int('deleted_by').default(sql`NULL`),
  },
  (table) => [
    index('user_id').on(table.userId),
    index('created_at').on(table.createdAt),
    index('deleted_at').on(table.deletedAt),
  ],
)

export type ContributionsSelect = typeof contributionsTable.$inferSelect
export type ContributionsInsert = typeof contributionsTable.$inferInsert

export const dltTransactionsTable = mysqlTable(
  'dlt_transactions',
  {
    id: int().autoincrement().notNull(),
    transactionId: int('transaction_id').default(sql`NULL`),
    userId: int('user_id').default(sql`NULL`),
    transactionLinkId: int('transaction_link_id').default(sql`NULL`),
    typeId: int('type_id').notNull(),
    hieroTransactionId: varchar('hiero_transaction_id', { length: 255 }).default(sql`NULL`),
    verified: tinyint().default(0).notNull(),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default('current_timestamp(3)')
      .notNull(),
    verifiedAt: datetime('verified_at', { mode: 'string', fsp: 3 }).default(sql`NULL`),
    error: text().default(sql`NULL`),
  },
  (table) => [
    uniqueIndex('dlt_transactions_hiero_transacion_id_unique').on(table.hieroTransactionId),
  ],
)

export type DltTransactionSelect = typeof dltTransactionsTable.$inferSelect
export type DltTransactionInsert = typeof dltTransactionsTable.$inferInsert

export const openaiThreadsTable = mysqlTable('openai_threads', {
  id: varchar({ length: 128 }).notNull(),
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().onUpdateNow().notNull(),
  userId: int('user_id').notNull(),
})

export const projectBrandingsTable = mysqlTable(
  'project_brandings',
  {
    id: int().autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    alias: varchar({ length: 32 }).notNull(),
    description: text().default(sql`NULL`),
    spaceId: int('space_id').default(sql`NULL`),
    spaceUrl: varchar('space_url', { length: 255 }).default(sql`NULL`),
    newUserToSpace: tinyint('new_user_to_space').default(0).notNull(),
    logoUrl: varchar('logo_url', { length: 255 }).default(sql`NULL`),
  },
  (table) => [uniqueIndex('project_brandings_alias_unique').on(table.alias)],
)

export type ProjectBrandingSelect = typeof projectBrandingsTable.$inferSelect
export type ProjectBrandingInsert = typeof projectBrandingsTable.$inferInsert

export const transactionsTable = mysqlTable(
  'transactions',
  {
    id: int().autoincrement().notNull(),
    previous: int().default(sql`NULL`),
    typeId: int('type_id').default(sql`NULL`),
    transactionLinkId: int('transaction_link_id').default(sql`NULL`),
    amount: customGradidoUnit('amount_gdd4').default(sql`NULL`),
    balance: customGradidoUnit('balance_gdd4').default(sql`NULL`),
    balanceDate: datetime('balance_date', { mode: 'string', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    memo: varchar({ length: 512 }).notNull(),
    userId: int('user_id').notNull(),
    linkedUserId: int('linked_user_id').default(sql`NULL`),
    linkedTransactionId: int('linked_transaction_id').default(sql`NULL`),
  },
  (table) => [
    index('user_id').on(table.userId),
    unique('previous').on(table.previous),
    index('idx_transactions_balance_date_id').on(table.balanceDate, table.id),
    index('idx_transaction_link_id').on(table.transactionLinkId),
    index('idx_linked_user_id').on(table.linkedUserId),
  ],
)

export type TransactionSelect = typeof transactionsTable.$inferSelect
export type TransactionInsert = typeof transactionsTable.$inferInsert

export const transactionLinksTable = mysqlTable(
  'transaction_links',
  {
    id: int().autoincrement().notNull(),
    userId: int().notNull(),
    amount: customGradidoUnit('amount_gdd4').default(sql`NULL`),
    holdAvailableAmount: customGradidoUnit('hold_available_amount_gdd4').default(sql`NULL`),
    memo: varchar({ length: 512 }).notNull(),
    code: varchar({ length: 24 }).notNull(),
    createdAt: datetime({ mode: 'string' }).notNull(),
    deletedAt: datetime({ mode: 'string' }).default(sql`NULL`),
    validUntil: datetime({ mode: 'string' }).notNull(),
    redeemedAt: datetime({ mode: 'string' }).default(sql`NULL`),
    redeemedBy: int().default(sql`NULL`),
  },
  (table) => [index('idx_userId').on(table.userId)],
)

export const usersTable = mysqlTable(
  'users',
  {
    id: int().autoincrement().notNull(),
    foreign: tinyint().default(0).notNull(),
    gradidoId: char('gradido_id', { length: 36 }).notNull(),
    communityUuid: varchar('community_uuid', { length: 36 }).default(sql`NULL`),
    alias: varchar({ length: 20 }).default(sql`NULL`),
    emailId: int('email_id').default(sql`NULL`),
    firstName: varchar('first_name', { length: 255 }).default(sql`NULL`),
    lastName: varchar('last_name', { length: 255 }).default(sql`NULL`),
    gmsPublishName: int('gms_publish_name').default(0).notNull(),
    humhubPublishName: int('humhub_publish_name').default(0).notNull(),
    deletedAt: datetime('deleted_at', { mode: 'string', fsp: 3 }).default(sql`NULL`),
    password: bigint({ mode: 'number' }),
    passwordEncryptionType: int('password_encryption_type').default(0).notNull(),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    language: varchar({ length: 4 }).default(sql`'de'`).notNull(),
    referrerId: int('referrer_id').default(sql`NULL`),
    contributionLinkId: int('contribution_link_id').default(sql`NULL`),
    publisherId: int('publisher_id').default(0),
    hideAmountGdd: tinyint().default(0),
    hideAmountGdt: tinyint().default(0),
    gmsAllowed: tinyint('gms_allowed').default(1).notNull(),
    // Warning: Can't parse geometry from database
    // geometryType: geometry("location"),
    gmsPublishLocation: int('gms_publish_location').default(2).notNull(),
    gmsRegistered: tinyint('gms_registered').default(0).notNull(),
    gmsRegisteredAt: datetime('gms_registered_at', { mode: 'string', fsp: 3 }).default(sql`NULL`),
    humhubAllowed: tinyint('humhub_allowed').default(0).notNull(),
  },
  (table) => [
    index('idx_users_created_id_uuid').on(table.createdAt, table.id, table.communityUuid),
    unique('uuid_key').on(table.gradidoId, table.communityUuid),
    unique('alias_key').on(table.alias, table.communityUuid),
  ],
)

export type UserSelect = typeof usersTable.$inferSelect
export type UserInsert = typeof usersTable.$inferInsert

export const usersTableIdentity = mysqlTable(
  'users',
  {
    id: int().autoincrement().notNull(),
    foreign: tinyint().default(0).notNull(),
    gradidoId: char('gradido_id', { length: 36 }).notNull(),
    communityUuid: varchar('community_uuid', { length: 36 }).default(sql`NULL`),
    alias: varchar({ length: 20 }).default(sql`NULL`),
    emailId: int('email_id').default(sql`NULL`),
    gmsPublishName: int('gms_publish_name').default(0).notNull(),
    humhubPublishName: int('humhub_publish_name').default(0).notNull(),
    deletedAt: datetime('deleted_at', { mode: 'string', fsp: 3 }).default(sql`NULL`),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    language: varchar({ length: 4 }).default(sql`'de'`).notNull(),
    gmsAllowed: tinyint('gms_allowed').default(1).notNull(),
    // Warning: Can't parse geometry from database
    // geometryType: geometry("location"),
    gmsPublishLocation: int('gms_publish_location').default(2).notNull(),
    gmsRegistered: tinyint('gms_registered').default(0).notNull(),
    humhubAllowed: tinyint('humhub_allowed').default(0).notNull(),
  }
)

export type UserSelectIdentity = typeof usersTableIdentity.$inferSelect
export type UserInsertIdentity = typeof usersTableIdentity.$inferInsert

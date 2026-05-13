import { sql } from 'drizzle-orm'
import {
  bigint,
  char,
  datetime,
  decimal,
  int,
  mysqlTable,
} from 'drizzle-orm/mysql-core'

// use only fields needed for the scripts in this folder

export const contributionsTable = mysqlTable('contributions', {
  id: int().autoincrement().notNull(),
  transactionId: int('transaction_id').default(sql`NULL`),
})

export const eventsTable = mysqlTable('events', {
  id: int().autoincrement().notNull(),
  involvedTransactionId: int('involved_transaction_id').default(sql`NULL`),
})


export const transactionsTable = mysqlTable(
  'transactions',
  {
    id: int().autoincrement().notNull(),
    previous: int().default(sql`NULL`),
    typeId: int('type_id').default(sql`NULL`),
    amount: bigint('amount_gdd4', { mode: 'bigint' }).default(sql`NULL`),
    amountFull: decimal('amount_legacy', { precision: 40, scale: 20, mode: 'string' }).default(sql`NULL`),
    balance: bigint('balance_gdd4', { mode: 'bigint' }).default(sql`NULL`),
    balanceFull: decimal('balance_legacy', { precision: 40, scale: 20, mode: 'string' }).default(sql`NULL`),
    decay: bigint('decay_gdd4', { mode: 'bigint' }).default(sql`NULL`),
    decayFull: decimal('decay_legacy', { precision: 40, scale: 20, mode: 'string' }).default(sql`NULL`),
    balanceDate: datetime('balance_date', { mode: 'string', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    decayCalculationType: int('decay_calculation_type').default(0),
    linkedUserCommunityUuid: char('linked_user_community_uuid', { length: 36 }).default(sql`NULL`),
  }
)

export const dltTransactionsTable = mysqlTable('dlt_transactions', {
  id: int().autoincrement().notNull(),
  transactionId: int('transaction_id').default(sql`NULL`),
})

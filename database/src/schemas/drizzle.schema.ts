import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const openaiThreadsTable = mysqlTable('openai_threads', {
  id: varchar({ length: 128 }).notNull(),
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().onUpdateNow().notNull(),
  userId: int('user_id').notNull(),
})
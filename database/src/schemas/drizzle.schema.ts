import { sql } from 'drizzle-orm'
import { int, mysqlTable, text, timestamp, tinyint, varchar } from 'drizzle-orm/mysql-core'

export const openaiThreadsTable = mysqlTable('openai_threads', {
  id: varchar({ length: 128 }).notNull(),
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'date' }).defaultNow().onUpdateNow().notNull(),
  userId: int('user_id').notNull(),
})

export const projectBrandingsTable = mysqlTable("project_brandings", {
  id: int().autoincrement().notNull(),
  name: varchar({ length: 255 }).notNull(),
  alias: varchar({ length: 32 }).notNull(),
  description: text().default(sql`NULL`),
  spaceId: int("space_id").default(sql`NULL`),
  spaceUrl: varchar("space_url", { length: 255 }).default(sql`NULL`),
  newUserToSpace: tinyint("new_user_to_space").default(0).notNull(),
  logoUrl: varchar("logo_url", { length: 255 }).default(sql`NULL`),
})
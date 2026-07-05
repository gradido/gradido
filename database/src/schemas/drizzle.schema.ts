import { sql } from 'drizzle-orm'
import {
  binary,
  datetime,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

export const communityHandshakeStatesTable = mysqlTable('community_handshake_states', {
	id: int().autoincrement().notNull(),
	handshakeId: int('handshake_id').notNull(),
	oneTimeCode: int('one_time_code').default(sql`NULL`),
	publicKey: binary('public_key', { length: 32 }).notNull(),
	apiVersion: varchar('api_version', { length: 255 }).notNull(),
	status: varchar({ length: 255 }).default('\'OPEN_CONNECTION\'').notNull(),
	lastError: text('last_error').default(sql`NULL`),
	createdAt: datetime('created_at', { mode: 'date', fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
	updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`).notNull(),
},
(table) => [
	index('idx_public_key').on(table.publicKey),
]);

export type CommunityHandshakeStateSelect = typeof communityHandshakeStatesTable.$inferSelect
export type CommunityHandshakeStateInsert = typeof communityHandshakeStatesTable.$inferInsert

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

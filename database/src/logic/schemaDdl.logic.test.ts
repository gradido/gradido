// AI-GENERATED — not an architecture reference
import { sql } from 'drizzle-orm'
import {
  check,
  datetime,
  foreignKey,
  index,
  int,
  mysqlTable,
  primaryKey,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'
import { createTableSql } from './schemaDdl.logic'

const exampleTable = mysqlTable(
  'examples',
  {
    id: int({ unsigned: true }).autoincrement().primaryKey().notNull(),
    userId: int('user_id').notNull(),
    name: varchar({ length: 20 }).default("it's").notNull(),
    email: varchar({ length: 255 }).charSet('utf8mb3').collate('utf8mb3_bin'),
    emoji: varchar({ length: 16 }).collate('utf8mb4_bin'),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .default(sql`current_timestamp(3)`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .default(sql`NULL`)
      .onUpdateNow({ fsp: 3 }),
  },
  (table) => [
    unique('uniq_examples_name').on(table.name, table.userId),
    uniqueIndex('examples_email_unique').on(table.email),
    index('idx_examples_user_created').on(table.userId, table.createdAt),
  ],
)

describe('createTableSql', () => {
  it('writes columns in their order, with the options the migrations would give them', () => {
    expect(createTableSql(exampleTable)).toBe(
      [
        'CREATE TABLE `examples` (',
        '  `id` int unsigned NOT NULL AUTO_INCREMENT,',
        '  `user_id` int NOT NULL,',
        "  `name` varchar(20) NOT NULL DEFAULT 'it''s',",
        '  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin,',
        '  `emoji` varchar(16) COLLATE utf8mb4_bin,',
        '  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),',
        '  `updated_at` datetime(3) DEFAULT NULL ON UPDATE current_timestamp(3),',
        '  PRIMARY KEY (`id`),',
        '  UNIQUE KEY `uniq_examples_name` (`name`, `user_id`),',
        '  UNIQUE KEY `examples_email_unique` (`email`),',
        '  KEY `idx_examples_user_created` (`user_id`, `created_at`)',
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
      ].join('\n'),
    )
  })

  it('creates the table with the collation it is given, and its charset', () => {
    expect(createTableSql(exampleTable, 'utf8mb4_general_ci')).toEndWith(
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
    )
  })

  it('writes a composite primary key at the table', () => {
    const table = mysqlTable('pairs', { left: int().notNull(), right: int().notNull() }, (t) => [
      primaryKey({ columns: [t.left, t.right] }),
    ])
    expect(createTableSql(table)).toContain('  PRIMARY KEY (`left`, `right`)\n')
  })

  it('refuses a foreign key rather than leaving it out', () => {
    const table = mysqlTable('children', { parentId: int('parent_id') }, (t) => [
      foreignKey({ columns: [t.parentId], foreignColumns: [exampleTable.id] }),
    ])
    expect(() => createTableSql(table)).toThrow('foreign keys are not supported')
  })

  it('refuses a check constraint rather than leaving it out', () => {
    const table = mysqlTable('checked', { amount: int() }, (t) => [
      check('amount_positive', sql`${t.amount} > 0`),
    ])
    expect(() => createTableSql(table)).toThrow('check constraints are not supported')
  })
})

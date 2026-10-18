// AI-GENERATED — not an architecture reference
import fs from 'node:fs'
import { is } from 'drizzle-orm'
import { getTableConfig, MySqlTable } from 'drizzle-orm/mysql-core'
import { MIGRATIONS_TABLE } from '../src/config/const'
import { createTableSql } from '../src/logic/schemaDdl.logic'
import * as schema from '../src/schemas/drizzle.schema'

type QueryFn = (query: string) => Promise<unknown>

const MIGRATION_FILE_PATTERN = /^(\d+)-.+\.ts$/

/**
 * The rows ts-mysql-migrate writes into `migrations` when it runs every script of `dir` on
 * an empty database: the files sorted by their number, `version` counting from 1 in that
 * order (`Migration.loadScripts`). The library keeps that list private, so it is rebuilt
 * here; createFromSchema.test.ts compares the result with a database the library migrated.
 */
export function migrationRows(dir: string): { version: number; fileName: string }[] {
  return fs
    .readdirSync(dir)
    .filter((file) => MIGRATION_FILE_PATTERN.test(file))
    .sort((a, b) => Number(a.split('-')[0]) - Number(b.split('-')[0]))
    .map((fileName, index) => ({ version: index + 1, fileName }))
}

/**
 * Builds an empty database from drizzle.schema.ts instead of running every migration, and
 * records every migration as done, so the next `up` starts after the last one.
 *
 * Expects the database to hold nothing but the `migrations` table, empty, as
 * `Migration.initialize()` leaves it - that table's DDL stays the library's own.
 *
 * DDL is not transactional in MariaDB. Should a table or the recording of the migrations
 * fail, the tables created are dropped again and `migrations` is left empty, so the next
 * `up` finds a database that is not empty and runs the migrations the long way.
 *
 * Returns the file name of the last migration recorded.
 */
export async function createDatabaseFromSchema(query: QueryFn, dir: string): Promise<string> {
  const rows = migrationRows(dir)
  if (rows.length === 0) {
    throw new Error(`no migration files in ${dir}`)
  }

  const tables = Object.values(schema as Record<string, unknown>).filter(
    (value): value is MySqlTable => is(value, MySqlTable),
  )
  const created: string[] = []
  try {
    for (const table of tables) {
      const name = getTableConfig(table).name
      await query(createTableSql(table, schema.tableCollations[name]))
      created.push(name)
    }
    // One statement, so the database is either recorded at the latest version or not at all.
    const values = rows.map((row) => `(${row.version}, '${row.fileName}')`).join(', ')
    await query(`INSERT INTO ${MIGRATIONS_TABLE} (version, fileName) VALUES ${values}`)
  } catch (error) {
    for (const name of created) {
      await query(`DROP TABLE IF EXISTS \`${name}\``)
    }
    throw error
  }
  return rows[rows.length - 1].fileName
}

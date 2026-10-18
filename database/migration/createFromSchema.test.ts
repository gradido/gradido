// AI-GENERATED — not an architecture reference
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Connection, createConnection, RowDataPacket } from 'mysql2/promise'
import { CONFIG } from '../src/config'
import { createDatabaseFromSchema, migrationRows } from './createFromSchema'

describe('with migration files', () => {
  let dir: string

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-'))
    for (const file of ['0010-ten.ts', '0002-two.ts', '0100-hundred.ts', 'README.md']) {
      fs.writeFileSync(path.join(dir, file), '')
    }
  })

  afterAll(() => {
    fs.rmSync(dir, { recursive: true })
  })

  it('numbers the migration files from 1 in the order of their number, not of their name', () => {
    expect(migrationRows(dir)).toEqual([
      { version: 1, fileName: '0002-two.ts' },
      { version: 2, fileName: '0010-ten.ts' },
      { version: 3, fileName: '0100-hundred.ts' },
    ])
  })

  it('drops every table it created when the migrations cannot be recorded', async () => {
    const statements: string[] = []
    const query = async (statement: string) => {
      statements.push(statement)
      if (statement.startsWith('INSERT INTO')) {
        throw new Error('insert failed')
      }
    }
    await expect(createDatabaseFromSchema(query, dir)).rejects.toThrow('insert failed')
    const created = statements.filter((s) => s.startsWith('CREATE TABLE')).length
    expect(created).toBeGreaterThan(40)
    expect(statements.filter((s) => s.startsWith('DROP TABLE')).length).toBe(created)
  })
})

// The schema is only a faster way to the database the migrations build. This holds the two
// against each other: one database through every migration, one built from the schema by
// `up`, both from nothing.
describe('up on an empty database', () => {
  const databaseDir = path.join(__dirname, '..')
  const fromMigrations = `${CONFIG.DB_DATABASE}_from_migrations`
  const fromSchema = `${CONFIG.DB_DATABASE}_from_schema`
  let connection: Connection

  function up(database: string, ...flags: string[]): string {
    const result = spawnSync(process.execPath, ['run', 'up', ...flags], {
      cwd: databaseDir,
      env: { ...process.env, DB_DATABASE: database },
      encoding: 'utf8',
    })
    if (result.status !== 0) {
      throw new Error(`up ${database} failed:\n${result.stdout}\n${result.stderr}`)
    }
    return result.stdout
  }

  async function rows(query: string, database: string): Promise<string[]> {
    const [result] = await connection.query<RowDataPacket[]>(query, [database])
    return result.map((row) => Object.values(row).join(' | '))
  }

  // Everything a later migration or a dump restored into the database could trip over.
  // Integer display widths (`int(10)` against `int(11)`) are left out: MariaDB ignores them,
  // drizzle cannot write them, and neither driver in this house reads them.
  async function structure(database: string) {
    return {
      tables: await rows(
        'SELECT table_name, engine, table_collation FROM information_schema.tables WHERE table_schema = ? ORDER BY 1',
        database,
      ),
      columns: await rows(
        `SELECT table_name, ordinal_position, column_name,
           REGEXP_REPLACE(column_type, '(int)\\\\([0-9]+\\\\)', '\\\\1'),
           is_nullable, column_default, extra, character_set_name, collation_name
         FROM information_schema.columns WHERE table_schema = ? ORDER BY 1, 2`,
        database,
      ),
      indexes: await rows(
        `SELECT table_name, index_name, non_unique, index_type,
           GROUP_CONCAT(column_name ORDER BY seq_in_index)
         FROM information_schema.statistics WHERE table_schema = ?
         GROUP BY table_name, index_name, non_unique, index_type ORDER BY 1, 2`,
        database,
      ),
      checks: await rows(
        'SELECT table_name, constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_schema = ? ORDER BY 1, 2',
        database,
      ),
    }
  }

  async function dropDatabases() {
    await connection.query(`DROP DATABASE IF EXISTS \`${fromMigrations}\``)
    await connection.query(`DROP DATABASE IF EXISTS \`${fromSchema}\``)
  }

  beforeAll(async () => {
    connection = await createConnection({
      host: CONFIG.DB_HOST,
      port: CONFIG.DB_PORT,
      user: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
    })
    await dropDatabases()
    up(fromMigrations, '--migrations')
    expect(up(fromSchema)).toContain('built from drizzle.schema')
  })

  afterAll(async () => {
    await dropDatabases()
    await connection.end()
  })

  it('builds the tables the migrations build', async () => {
    const expected = await structure(fromMigrations)
    // The fixture has to prove itself: an empty comparison would pass as well.
    expect(expected.tables.length).toBeGreaterThan(40)
    expect(await structure(fromSchema)).toEqual(expected)
  })

  it('records every migration, so the next up has nothing to do', async () => {
    const recorded = 'SELECT version, fileName FROM migrations ORDER BY version'
    await connection.query(`USE \`${fromMigrations}\``)
    const [expected] = await connection.query<RowDataPacket[]>(recorded)
    await connection.query(`USE \`${fromSchema}\``)
    const [actual] = await connection.query<RowDataPacket[]>(recorded)
    expect(actual).toEqual(expected)
    expect(up(fromSchema)).toContain('Database is up to date')
  })
})

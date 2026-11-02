// AI-GENERATED — not an architecture reference
import { eq } from 'drizzle-orm'
import { AppDatabase, drizzleDb } from '../AppDatabase'
import { latestDbVersion } from '../detectLastDBVersion'
import { migrationsTable } from '../schemas/migrations.schema'
import { dbSelectLatestMigrationFileName } from './migrations'

const appDB = AppDatabase.getInstance()
const LATER_VERSION = 999999

const withLaterMigration = async (fileName: string, check: () => Promise<void>): Promise<void> => {
  await drizzleDb().insert(migrationsTable).values({ version: LATER_VERSION, fileName })
  try {
    await check()
  } finally {
    await drizzleDb().delete(migrationsTable).where(eq(migrationsTable.version, LATER_VERSION))
  }
}

beforeEach(async () => {
  await appDB.init(false, false, true)
})

afterEach(async () => {
  await appDB.destroy()
})

describe('dbSelectLatestMigrationFileName', () => {
  it('names the migration with the highest version', async () => {
    await withLaterMigration('9999-later.ts', async () => {
      expect(await dbSelectLatestMigrationFileName()).toBe('9999-later.ts')
    })
  })
})

describe('AppDatabase.init with Drizzle only', () => {
  it('accepts the database at the latest version', async () => {
    expect(await dbSelectLatestMigrationFileName()).toStartWith(latestDbVersion)
  })

  it('refuses a database at another version', async () => {
    await withLaterMigration('9999-later.ts', async () => {
      await appDB.destroy()
      await expect(appDB.init(false, false, true)).rejects.toThrow('Wrong database version')
      // for the cleanup of withLaterMigration, on the pool the failed init left behind
    })
  })
})

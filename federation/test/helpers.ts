import { AppDatabase, dbDeleteAllRowsExceptMigrations, HOME_COMMUNITY_CHANGED_CHANNEL } from 'database'

const TEST_DATABASE_PREFIX = 'gradido_test'

export const cleanDB = async () => {
  // Never the database of a community: a test run without DB_DATABASE would empty
  // gradido_community, the name the config falls back to.
  const database = process.env.DB_DATABASE
  if (!database?.startsWith(TEST_DATABASE_PREFIX)) {
    throw new Error(
      `cleanDB empties every table: '${database}' is no test database (${TEST_DATABASE_PREFIX}…)`,
    )
  }

  // Every table except `migrations`, in one statement that reads the table list itself - a
  // table with or without a TypeORM entity, and one added tomorrow, alike.
  await dbDeleteAllRowsExceptMigrations()

  // The rows are gone past the query functions, so nobody announced it: the cached home
  // community would outlive them. publish() reaches this process at once, Redis or not.
  AppDatabase.getInstance().publish(HOME_COMMUNITY_CHANGED_CHANNEL)
}

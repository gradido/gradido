import { DatabaseState, getDatabaseState } from './prepare'
import { CONFIG } from './config'

import { createPool } from 'mysql2'
import { Migration, MigrationConnection } from 'ts-mysql-migrate'
import path from 'path'

const run = async (command: string) => {
  // Database actions not supported by our migration library
  // await createDatabase()
  const state = await getDatabaseState()
  if (state === DatabaseState.NOT_CONNECTED) {
    throw new Error('Database not connected')
  }
  if (state === DatabaseState.HIGHER_VERSION) {
    throw new Error('Database version is higher than required, please switch to the correct branch')
  }
  if (state === DatabaseState.SAME_VERSION) {
    // eslint-disable-next-line no-console
    console.log('Database is up to date')
    return
  }
  // Initialize Migrations
  const pool = createPool({
    host: CONFIG.DB_HOST,
    port: CONFIG.DB_PORT,
    user: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD,
    database: CONFIG.DB_DATABASE,
  })
  const migration = new Migration({
    conn: pool as unknown as MigrationConnection,
    tableName: CONFIG.MIGRATIONS_TABLE,
    silent: true,
    dir: path.join(__dirname, '..', 'migrations'),
  })
  await migration.initialize()

  // Execute command
  switch (command) {
    case 'up':
      await migration.up() // use for upgrade script
      break
    case 'down':
      await migration.down() // use for downgrade script
      break
    case 'reset':
      // TODO protect from production
      await migration.reset()
      break
    default:
      throw new Error(`Unsupported command ${command}`)
  }

  // Terminate connections gracefully
  pool.end()
}

run(process.argv[2])
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.log(err)
    process.exit(1)
  })
  .then(() => {
    process.exit()
  })

import { createDatabase } from './prepare'
import { CONFIG } from './config'

import { createPool } from 'mysql'
import { Migration } from 'ts-mysql-migrate'
import path from 'path'

const migrateDB = async (command: string, database: string) => {
  // Database actions not supported by our migration library
  await createDatabase(database)

  // Initialize Migrations
  const pool = createPool({
    host: CONFIG.DB_HOST,
    port: CONFIG.DB_PORT,
    user: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD,
    database,
  })
  const migration = new Migration({
    conn: pool,
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

const run = async (command: string) => {
  await migrateDB(command, CONFIG.DB_DATABASE)
  if (CONFIG.DB_DATABASE_TEST) {
    await migrateDB(command, CONFIG.DB_DATABASE_TEST)
  }
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

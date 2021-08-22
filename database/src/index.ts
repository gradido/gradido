import { createPool, PoolConfig } from 'mysql'
import { Migration } from 'ts-mysql-migrate'
import CONFIG from './config'
import prepare from './prepare'

const run = async (command: string) => {
  await prepare()

  // Database connection
  const poolConfig: PoolConfig = {
    host: CONFIG.DB_HOST,
    port: CONFIG.DB_PORT,
    user: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD,
    database: CONFIG.DB_DATABASE,
  }

  // Pool?
  const pool = createPool(poolConfig)

  // Create & Initialize Migrations
  const migration = new Migration({
    conn: pool,
    tableName: CONFIG.MIGRATIONS_TABLE,
    dir: CONFIG.MIGRATIONS_DIRECTORY,
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
      await migration.reset() // use for resetting database
      break
    default:
      throw new Error(`Unsupported command ${command}`)
  }
}

run(process.argv[2])
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.log(err)
  })
  .then(() => {
    process.exit()
  })

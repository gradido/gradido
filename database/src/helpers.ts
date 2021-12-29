import CONFIG from './config'
import { createPool, PoolConfig } from 'mysql'
import { Migration } from 'ts-mysql-migrate'
import path from 'path'

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
  silent: true,
  dir: path.join(__dirname, '..', 'migrations'),
})

const initialize = async (): Promise<void> => {
  await migration.initialize()
}

const resetDB = async (closePool = false): Promise<void> => {
  await migration.reset() // use for resetting database
  if (closePool) pool.end()
}

export { resetDB, pool, migration, initialize }

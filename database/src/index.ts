/* eslint-disable no-console */
import { DatabaseState, getDatabaseState } from './prepare'
import { CONFIG } from './config'

import { createPool } from 'mysql2'
import { Migration, MigrationConnection } from 'ts-mysql-migrate'
import path from 'path'
import { latestDbVersion } from './config/detectLastDBVersion'
import { clearDatabase } from './clear'

const run = async (command: string) => {
  if (command === 'clear') {
    if (CONFIG.NODE_ENV === 'production') {
      throw new Error('Clearing database in production is not allowed')
    }
    await clearDatabase()
    return
  }
  // Database actions not supported by our migration library
  // await createDatabase()
  const state = await getDatabaseState()
  if (state === DatabaseState.NOT_CONNECTED) {
    throw new Error(
      `Database not connected, is database server running?
      host: ${CONFIG.DB_HOST}
      port: ${CONFIG.DB_PORT}
      user: ${CONFIG.DB_USER}
      password: ${CONFIG.DB_PASSWORD.slice(-2)}
      database: ${CONFIG.DB_DATABASE}`,
    )
  }
  if (state === DatabaseState.HIGHER_VERSION) {
    throw new Error('Database version is higher than required, please switch to the correct branch')
  }
  if (state === DatabaseState.SAME_VERSION) {
    if (command === 'up') {
      console.log('Database is up to date')
      return
    }
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
      if (CONFIG.NODE_ENV === 'production') {
        throw new Error('Resetting database in production is not allowed')
      }
      await migration.reset()
      break
    default:
      throw new Error(`Unsupported command ${command}`)
  }
  if (command === 'reset') {
    console.log('Database was reset')
  } else {
    const currentDbVersion = await migration.getLastVersion()
    console.log(`Database was ${command} migrated to version: ${currentDbVersion.fileName}`)
    if (latestDbVersion === currentDbVersion.fileName.split('.')[0]) {
      console.log('Database is now up to date')
    } else {
      console.log('The latest database version is: ', latestDbVersion)
    }
  }
  // Terminate connections gracefully
  pool.end()
}

run(process.argv[2])
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })
  .then(() => {
    process.exit()
  })

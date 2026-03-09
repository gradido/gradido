import { CONFIG } from '../src/config'
import { DatabaseState, getDatabaseState } from './prepare'

import path from 'node:path'
import { createPool } from 'mysql'
import { Migration } from 'ts-mysql-migrate'
import { clearDatabase } from './clear'
import { latestDbVersion } from '../src/detectLastDBVersion'
import { MIGRATIONS_TABLE } from '../src/config/const'

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
      password: last 2 character: ${CONFIG.DB_PASSWORD.slice(-2)}
      database: ${CONFIG.DB_DATABASE}`,
    )
  }
  if (state === DatabaseState.HIGHER_VERSION) {
    throw new Error('Database version is higher than required, please switch to the correct branch')
  }
  if (state === DatabaseState.SAME_VERSION) {
    if (command === 'up') {
      // biome-ignore lint/suspicious/noConsole: no logger present
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
    conn: pool,
    tableName: MIGRATIONS_TABLE,
    silent: true,
    dir: path.join(__dirname, 'migrations'),
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
    // biome-ignore lint/suspicious/noConsole: no logger present
    console.log('Database was reset')
  } else {
    const currentDbVersion = await migration.getLastVersion()
    // biome-ignore lint/suspicious/noConsole: no logger present
    console.log(`Database was ${command} migrated to version: ${currentDbVersion.fileName}`)
    if (latestDbVersion === currentDbVersion.fileName.split('.')[0]) {
      // biome-ignore lint/suspicious/noConsole: no logger present
      console.log('Database is now up to date')
    } else {
      // biome-ignore lint/suspicious/noConsole: no logger present
      console.log('The latest database version is: ', latestDbVersion)
    }
  }

  // Terminate connections gracefully
  pool.end()
}

run(process.argv[2])
  .catch((err) => {
    // biome-ignore lint/suspicious/noConsole: no logger present
    console.log(err)
    process.exit(1)
  })
  .then(() => {
    process.exit()
  })

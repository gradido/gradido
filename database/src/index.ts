import 'reflect-metadata'
import { createPool, PoolConfig } from 'mysql'
import { Migration } from 'ts-mysql-migrate'
import CONFIG from './config'
import prepare from './prepare'
import connection from './typeorm/connection'
import { useSeeding, runSeeder } from 'typeorm-seeding'
import { CreateUserSeed } from './seeds/create-user.seed'

const run = async (command: string) => {
  // Database actions not supported by our migration library
  await prepare()

  // Database connection for Migrations
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

  // Database connection for TypeORM
  const con = await connection()
  if (!con || !con.isConnected) {
    throw new Error(`Couldn't open connection to database`)
  }

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
    case 'seed':
      await useSeeding({
        root: process.cwd(),
        configName: 'ormconfig.js',
      })
      await runSeeder(CreateUserSeed)
      break
    default:
      throw new Error(`Unsupported command ${command}`)
  }

  // Terminate connections gracefully
  await con.close()
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

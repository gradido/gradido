import 'reflect-metadata'
import prepare from './prepare'
import connection from './typeorm/connection'
import { resetDB, pool, migration } from './helpers'

const run = async (command: string) => {
  // Database actions not supported by our migration library
  await prepare()

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
      // TODO protect from production
      await resetDB() // use for resetting database
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

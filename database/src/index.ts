import 'reflect-metadata'
import prepare from './prepare'
import connection from './typeorm/connection'
import { CreatePeterLustigSeed } from './seeds/users/peter-lustig.admin.seed'
import { CreateBibiBloxbergSeed } from './seeds/users/bibi-bloxberg.seed'
import { CreateRaeuberHotzenplotzSeed } from './seeds/users/raeuber-hotzenplotz.seed'
import { CreateBobBaumeisterSeed } from './seeds/users/bob-baumeister.seed'
import { CreateStephenHawkingSeed } from './seeds/users/stephen-hawking.seed'
import { CreateGarrickOllivanderSeed } from './seeds/users/garrick-ollivander.seed'
import { CreateUserSeed } from './seeds/create-user.seed'
import { resetDB, pool, migration, runSeeds } from './helpers'

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
    case 'seed':
      // TODO protect from production
      // await runSeeder(CreatePeterLustigSeed)
      await runSeeds([
        CreatePeterLustigSeed,
        CreateBibiBloxbergSeed,
        CreateRaeuberHotzenplotzSeed,
        CreateBobBaumeisterSeed,
        CreateStephenHawkingSeed,
        CreateGarrickOllivanderSeed,
        ...Array(96).fill(CreateUserSeed),
      ])
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

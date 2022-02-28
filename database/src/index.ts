import 'reflect-metadata'
import prepare from './prepare'
import connection from './typeorm/connection'
import { useSeeding, runSeeder } from 'typeorm-seeding'
import { CreatePeterLustigSeed } from './seeds/users/peter-lustig.admin.seed'
import { CreateBibiBloxbergSeed } from './seeds/users/bibi-bloxberg.seed'
import { CreateRaeuberHotzenplotzSeed } from './seeds/users/raeuber-hotzenplotz.seed'
import { CreateBobBaumeisterSeed } from './seeds/users/bob-baumeister.seed'
import { CreateStephenHawkingSeed } from './seeds/users/stephen-hawking.seed'
import { CreateGarrickOllivanderSeed } from './seeds/users/garrick-ollivander.seed'
import { CreateUserSeed } from './seeds/create-user.seed'
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
    case 'seed':
      // TODO protect from production
      await useSeeding({
        root: process.cwd(),
        configName: 'ormconfig.js',
      })
      await runSeeder(CreatePeterLustigSeed)
      await runSeeder(CreateBibiBloxbergSeed)
      await runSeeder(CreateRaeuberHotzenplotzSeed)
      await runSeeder(CreateBobBaumeisterSeed)
      await runSeeder(CreateStephenHawkingSeed)
      // eslint-disable-next-line prefer-spread
      Array.apply(null, Array(96)).forEach(async () => {
        await runSeeder(CreateUserSeed)
      })
      await runSeeder(CreateGarrickOllivanderSeed)
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

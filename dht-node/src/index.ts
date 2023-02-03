/* eslint-disable @typescript-eslint/no-explicit-any */
import { startDHT } from '@/dht_node/index'

// config
import CONFIG from './config'
import { logger } from './server/logger'
import connection from './typeorm/connection'
import { checkDBVersion } from './typeorm/DBVersion'

async function main() {
  // open mysql connection
  const con = await connection()
  if (!con || !con.isConnected) {
    logger.fatal(`Couldn't open connection to database!`)
    throw new Error(`Fatal: Couldn't open connection to database`)
  }

  // check for correct database version
  const dbVersion = await checkDBVersion(CONFIG.DB_VERSION)
  if (!dbVersion) {
    logger.fatal('Fatal: Database Version incorrect')
    throw new Error('Fatal: Database Version incorrect')
  }

  // eslint-disable-next-line no-console
  console.log(
    `starting Federation on ${CONFIG.FEDERATION_DHT_TOPIC} ${
      CONFIG.FEDERATION_DHT_SEED ? 'with seed...' : 'without seed...'
    }`,
  )
  await startDHT(CONFIG.FEDERATION_DHT_TOPIC)
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})

import { startDHT } from '@/dht_node/index'

import { CONFIG } from './config'
import { logger } from './server/logger'
import { checkDBVersion } from './typeorm/DBVersion'
import { connection } from './typeorm/connection'

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
  logger.debug(`dhtseed set by CONFIG.FEDERATION_DHT_SEED=${CONFIG.FEDERATION_DHT_SEED}`)
  logger.info(
    `starting Federation on ${CONFIG.FEDERATION_DHT_TOPIC} ${
      CONFIG.FEDERATION_DHT_SEED ? 'with seed...' : 'without seed...'
    }`,
  )
  await startDHT(CONFIG.FEDERATION_DHT_TOPIC)
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: no logger present
  console.error(e)
  throw e
})

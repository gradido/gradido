/* eslint-disable @typescript-eslint/no-explicit-any */
import { startDHT } from '@/dht_node/index'

import { CONFIG } from './config'
import { logger } from './server/logger'
import { connection } from './typeorm/connection'
import { checkDBVersion } from './typeorm/DBVersion'

async function main() {
  process.stdout.write('Test stdout log\n')
  process.stderr.write('Test stderr log\n')

  // open mysql connection
  const con = await connection()
  if (!con?.isConnected) {
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
  // eslint-disable-next-line no-console
  console.error(e)
  throw e
})

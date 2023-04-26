/* eslint-disable @typescript-eslint/no-explicit-any */
import { startDHT } from '@/dht_node/index'

// config
import CONFIG from './config'
import DEVOP from './config/devop'
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
  // first read from .env.devop if exist
  let dhttopic = DEVOP.FEDERATION_DHT_TOPIC
  logger.debug('dhttopic set by DEVOP.FEDERATION_DHT_TOPIC={}', DEVOP.FEDERATION_DHT_TOPIC)
  if (!dhttopic) {
    dhttopic = CONFIG.FEDERATION_DHT_TOPIC
    logger.debug(
      'dhttopic overwritten by CONFIG.FEDERATION_DHT_TOPIC={}',
      CONFIG.FEDERATION_DHT_TOPIC,
    )
  }
  let dhtseed = DEVOP.FEDERATION_DHT_SEED
  logger.debug('dhtseed set by DEVOP.FEDERATION_DHT_SEED={}', DEVOP.FEDERATION_DHT_SEED)
  if (!dhtseed) {
    dhtseed = CONFIG.FEDERATION_DHT_SEED
    logger.debug('dhtseed overwritten by CONFIG.FEDERATION_DHT_SEED={}', CONFIG.FEDERATION_DHT_SEED)
  }
  logger.info(`starting Federation on ${dhttopic} ${dhtseed ? 'with seed...' : 'without seed...'}`)
  await startDHT(dhttopic)
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})

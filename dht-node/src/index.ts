import 'source-map-support/register'
import { defaultCategory, initLogger } from 'config-schema'
import { AppDatabase } from 'database'
import { getLogger } from 'log4js'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { startDHT } from '@/dht_node/index'

async function main() {
  // init logger
  initLogger(
    [defaultCategory(LOG4JS_BASE_CATEGORY_NAME, CONFIG.LOG_LEVEL)],
    CONFIG.LOG_FILES_BASE_PATH,
    CONFIG.LOG4JS_CONFIG,
  )
  const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}`)
  // open mysql connection
  await AppDatabase.getInstance().init()
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

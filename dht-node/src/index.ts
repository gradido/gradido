import { startDHT } from '@/dht_node/index'

import { CONFIG } from '@/config'
import { logger } from '@/server/logger'
import { AppDatabase } from 'database'

async function main() {
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { startDHT } from '@/dht_node/index'

// config
import CONFIG from './config'

async function main() {
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

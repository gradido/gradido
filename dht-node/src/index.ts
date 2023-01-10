/* eslint-disable @typescript-eslint/no-explicit-any */

import createServer from './server/createServer'
import { startDHT } from '@/dht_node/index'

// config
import CONFIG from './config'

async function main() {
  const { app } = await createServer()

  // die when there is no FEDERATION_DHT_TOPIC defined
  if (!CONFIG.FEDERATION_DHT_TOPIC) {
    throw new Error(
      'You have to configure a `FEDERATION_DHT_TOPIC` in the config to run this service.',
    )
  }

  // eslint-disable-next-line no-console
  console.log(
    `starting Federation on ${CONFIG.FEDERATION_DHT_TOPIC} ${
      CONFIG.FEDERATION_DHT_SEED ? 'with seed...' : 'without seed...'
    }`,
  )
  await startDHT(CONFIG.FEDERATION_DHT_TOPIC)

  // management interface
  app.listen(CONFIG.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`)
    if (CONFIG.GRAPHIQL) {
      // eslint-disable-next-line no-console
      console.log(`GraphIQL available at http://localhost:${CONFIG.PORT}`)
    }
  })
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})

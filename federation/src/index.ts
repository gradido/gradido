/* eslint-disable @typescript-eslint/no-explicit-any */

import createServer from './server/createServer'
import { startDHT } from '@/dht_node/index'

// config
import CONFIG from './config'

async function main() {
  // in case of active DHT running on port 5000 else running on (default=5001) CONFIG.FEDERATION_PORT 
  const port = CONFIG.FEDERATION_DHT_TOPIC ? 5000 : CONFIG.FEDERATION_PORT
    // eslint-disable-next-line no-console
    console.log(`FEDERATION_PORT=${CONFIG.FEDERATION_PORT}`)
    console.log(`FEDERATION_API=${CONFIG.FEDERATION_API}`)
    console.log(`configured: FEDERATION_DHT_TOPIC=${CONFIG.FEDERATION_DHT_TOPIC}`)
    console.log(`depending on DHT_TOPIC using => port=${port}`)
  const { app } = await createServer()
  
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${port}`)
    if (CONFIG.GRAPHIQL) {
      // eslint-disable-next-line no-console
      console.log(`GraphIQL available at http://localhost:${port}`)
    }
  })

  // start DHT hyperswarm when DHT_TOPIC is set in .env
  if (CONFIG.FEDERATION_DHT_TOPIC) {
    // eslint-disable-next-line no-console
    console.log(
      `starting Federation on ${CONFIG.FEDERATION_DHT_TOPIC} ${
        CONFIG.FEDERATION_DHT_SEED ? 'with seed...' : 'without seed...'
      }`,
    )
    await startDHT(CONFIG.FEDERATION_DHT_TOPIC) // con,
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})

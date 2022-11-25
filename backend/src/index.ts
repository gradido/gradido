/* eslint-disable @typescript-eslint/no-explicit-any */

import createServer from './server/createServer'
import { startDHT } from '@/federation/index'

// config
import CONFIG from './config'

async function main() {
  const { app } = await createServer()

  app.listen(CONFIG.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`)
    if (CONFIG.GRAPHIQL) {
      // eslint-disable-next-line no-console
      console.log(`GraphIQL available at http://localhost:${CONFIG.PORT}`)
    }
  })

  // start DHT hyperswarm when DHT_TOPIC is set in .env
  if (CONFIG.FEDERATION_DHT_TOPIC) {
    // eslint-disable-next-line no-console
    console.log(`Federation active on ${CONFIG.FEDERATION_DHT_TOPIC}`)
    await startDHT(CONFIG.FEDERATION_DHT_TOPIC) // con,
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})

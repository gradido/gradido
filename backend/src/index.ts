/* eslint-disable @typescript-eslint/no-explicit-any */

import createServer from './server/createServer'
import { startDHT } from '@/federation/index'

// config
import CONFIG from './config'

async function main() {
  const { app } = await createServer()

  if (CONFIG.FEDERATION_COMMUNITY_ACTIVATE_ENDPOINTS) {
    // eslint-disable-next-line no-console
    console.log(`activate community graphql-endpoints for federation-handshake...`)
    const { endpoints} = await activateEndpoints() 
    // eslint-disable-next-line no-console
    console.log(`activated endpoints: ${JSON.stringify(endpoints)}`)
  }

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

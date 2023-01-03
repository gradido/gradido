/* eslint-disable @typescript-eslint/no-explicit-any */

import createServer from './server/createServer'
import { startDHT } from '@/federation/index'

// config
import CONFIG from './config'
import { startValidateCommunities } from './federation/validateCommunities'

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
  startValidateCommunities(Number(CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER))

  // start DHT hyperswarm when DHT_TOPIC is set in .env
  if (CONFIG.FEDERATION_DHT_TOPIC) {
    if (CONFIG.FEDERATION_COMMUNITY_URL === null) {
      throw Error(`Config-Error: missing configuration of property FEDERATION_COMMUNITY_URL`)
    }
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

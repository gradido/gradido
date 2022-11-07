/* eslint-disable @typescript-eslint/no-explicit-any */

import createServer from './server/createServer'
import { startDHT } from '@/federation/index'

// config
import CONFIG from './config'

async function main() {
  const { app, con } = await createServer()

  app.listen(CONFIG.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`)
    if (CONFIG.GRAPHIQL) {
      // eslint-disable-next-line no-console
      console.log(`GraphIQL available at http://localhost:${CONFIG.PORT}`)
    }
  })

  // start DHT hyperswarm when DHT_TOPIC is set in .env
  if (CONFIG.DHT_TOPIC) {
    await startDHT(con, CONFIG.DHT_TOPIC)
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})

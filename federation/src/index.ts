/* eslint-disable @typescript-eslint/no-explicit-any */

import createServer from './server/createServer'

// config
import CONFIG from './config'

async function main() {
  // eslint-disable-next-line no-console
  console.log(`FEDERATION_PORT=${CONFIG.FEDERATION_PORT}`)
  console.log(`FEDERATION_API=${CONFIG.FEDERATION_API}`)
  const { app } = await createServer()
  
  app.listen(CONFIG.FEDERATION_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.FEDERATION_PORT}`)
    if (CONFIG.GRAPHIQL) {
      // eslint-disable-next-line no-console
      console.log(`GraphIQL available at http://localhost:${CONFIG.FEDERATION_PORT}`)
    }
  })
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})

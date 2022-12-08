/* eslint-disable @typescript-eslint/no-explicit-any */

import createServer from './server/createServer'
import { startDHT } from '@/dht_node/index'

// config
import CONFIG from './config'

async function main() {
  // TODO better to use yargs than this fix cli-patter -port 5000 -api 1_0
  const myArgs = process.argv.slice(2)
  const port = myArgs[0] === '-port' ? myArgs[1] : CONFIG.PORT
  const apiVersion = myArgs[2] === '-api' ? myArgs[3] : '1_0'
  
  const { app } = await createServer(apiVersion)

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

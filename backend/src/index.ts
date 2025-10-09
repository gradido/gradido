import 'reflect-metadata'
import 'source-map-support/register'
import { getLogger } from 'log4js'
import { CONFIG } from './config'
import { startValidateCommunities } from './federation/validateCommunities'
import { createServer } from './server/createServer'
import { writeJwtKeyPairInHomeCommunity } from './federation/validateCommunities'
import { initLogging } from './server/logger'

async function main() {
  initLogging()
  const { app } = await createServer(getLogger('apollo'))

  await writeJwtKeyPairInHomeCommunity()
  app.listen(CONFIG.PORT, () => {
    // biome-ignore lint/suspicious/noConsole: no need for logging the start message
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`)
    if (CONFIG.GRAPHIQL) {
      // biome-ignore lint/suspicious/noConsole: no need for logging the start message
      console.log(`GraphIQL available at http://localhost:${CONFIG.PORT}`)
    }
  })
  // task is running the whole time for transmitting transaction via dlt-connector to iota
  // can be notified with InterruptiveSleepManager.getInstance().interrupt(TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY)
  // that a new transaction or user was stored in db
  // void sendTransactionsToDltConnector()
  void startValidateCommunities(Number(CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER))
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  throw e
})

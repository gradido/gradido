import { CONFIG } from './config'
import { startValidateCommunities } from './federation/validateCommunities'
import { createServer } from './server/createServer'
import { sendTransactionsToDltConnector } from './tasks/sendTransactionsToDltConnector'

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
  // task is running the whole time for transmitting transaction via dlt-connector to iota
  // can be notified with InterruptiveSleepManager.getInstance().interrupt(TRANSMIT_TO_IOTA_INTERRUPTIVE_SLEEP_KEY)
  // that a new transaction or user was stored in db
  void sendTransactionsToDltConnector()
  void startValidateCommunities(Number(CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER))
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  throw e
})

import { CONFIG } from './config'
import { startValidateCommunities } from './federation/validateCommunities'
import { sendTransactionsToDltConnector } from './graphql/resolver/util/sendTransactionsToDltConnector'
import { createServer } from './server/createServer'

async function main() {
  const { app } = await createServer()

  app.listen(CONFIG.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`)
    if (CONFIG.GRAPHIQL) {
      // eslint-disable-next-line no-console
      console.log(`GraphIQL available at http://localhost:${CONFIG.PORT}`)
    }
    void sendTransactionsToDltConnector()
  })
  void startValidateCommunities(Number(CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER))
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  throw e
})

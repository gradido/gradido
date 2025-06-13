import 'reflect-metadata'
import { CONFIG } from './config'
import { startValidateCommunities } from './federation/validateCommunities'
import { createServer } from './server/createServer'
import { writeJwtKeyPairInHomeCommunity } from './federation/validateCommunities'

async function main() {
  const { app } = await createServer()

  app.listen(CONFIG.PORT, () => {
    // biome-ignore lint/suspicious/noConsole: no need for logging the start message
    console.log(`Server is running at http://localhost:${CONFIG.PORT}`)
    if (CONFIG.GRAPHIQL) {
      // biome-ignore lint/suspicious/noConsole: no need for logging the start message
      console.log(`GraphIQL available at http://localhost:${CONFIG.PORT}`)
    }
  })
  await writeJwtKeyPairInHomeCommunity()
  await startValidateCommunities(Number(CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER))
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  throw e
})

import 'reflect-metadata'
import 'source-map-support/register'
import { getLogger } from 'log4js'
import { matchingKeyingRun } from './apis/anthropic/matching/keyingRun'
import { CONFIG } from './config'
import {
  startValidateCommunities,
  writeJwtKeyPairInHomeCommunity,
} from './federation/validateCommunities'
import { createServer } from './server/createServer'
import { initLogging } from './server/logger'

async function main() {
  initLogging()
  const { app } = await createServer(getLogger('apollo'))

  await writeJwtKeyPairInHomeCommunity()
  app.listen(CONFIG.BACKEND_PORT, () => {
    // biome-ignore lint/suspicious/noConsole: no need for logging the start message
    console.log(`Server is running at http://localhost:${CONFIG.BACKEND_PORT}`)
    if (CONFIG.GRAPHIQL) {
      // biome-ignore lint/suspicious/noConsole: no need for logging the start message
      console.log(`GraphIQL available at http://localhost:${CONFIG.BACKEND_PORT}`)
    }
  })
  await startValidateCommunities(Number(CONFIG.FEDERATION_VALIDATE_COMMUNITY_TIMER))
  // Works out the words a matching entry can be found under, in the background. Does
  // nothing at all without an Anthropic key or without the GMS, and nothing is lost
  // by that: entries are stored and served either way, they are just not yet
  // findable by word.
  matchingKeyingRun.start()
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  throw e
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata'

import { CONFIG } from '@/config'

import { BackendClient } from './client/BackendClient'
import { CommunityRepository } from './data/Community.repository'
import { CommunityDraft } from './graphql/input/CommunityDraft'
import { AddCommunityContext } from './interactions/backendToDb/community/AddCommunity.context'
import { logger } from './logging/logger'
import createServer from './server/createServer'
import { LogError } from './server/LogError'

async function waitForServer(
  backend: BackendClient,
  retryIntervalMs: number,
  maxRetries: number,
): Promise<CommunityDraft> {
  let retries = 0
  while (retries < maxRetries) {
    logger.info(`Attempt ${retries + 1} for connecting to backend`)

    try {
      // Make a HEAD request to the server
      return await backend.getHomeCommunityDraft()
    } catch (error) {
      logger.info('Server is not reachable: ', error)
    }

    // Server is not reachable, wait and retry
    await new Promise((resolve) => setTimeout(resolve, retryIntervalMs))
    retries++
  }

  throw new LogError('Max retries exceeded. Server did not become reachable.')
}

async function main() {
  // eslint-disable-next-line no-console
  console.log(`DLT_CONNECTOR_PORT=${CONFIG.DLT_CONNECTOR_PORT}`)
  const { app } = await createServer()

  // ask backend for home community if we haven't one
  try {
    await CommunityRepository.loadHomeCommunityKeyPair()
  } catch (e) {
    const backend = BackendClient.getInstance()
    if (!backend) {
      throw new LogError('cannot create backend client')
    }
    // wait for backend server to be ready
    await waitForServer(backend, 1000, 8)

    const communityDraft = await backend.getHomeCommunityDraft()
    const addCommunityContext = new AddCommunityContext(communityDraft)
    await addCommunityContext.run()
  }

  app.listen(CONFIG.DLT_CONNECTOR_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.DLT_CONNECTOR_PORT}`)
  })
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  // eslint-disable-next-line n/no-process-exit
  process.exit(1)
})

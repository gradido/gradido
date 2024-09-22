/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata'

import { loadCryptoKeys, MemoryBlock } from 'gradido-blockchain-js'

import { CONFIG } from '@/config'

import { BackendClient } from './client/BackendClient'
import { CommunityDraft } from './graphql/input/CommunityDraft'
import { AddCommunityContext } from './interactions/backendToDb/community/AddCommunity.context'
import { logger } from './logging/logger'
import { KeyPairCacheManager } from './manager/KeyPairCacheManager'
import createServer from './server/createServer'
import { LogError } from './server/LogError'
import { stopTransmitToIota, transmitToIota } from './tasks/transmitToIota'

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
  if (CONFIG.IOTA_HOME_COMMUNITY_SEED) {
    try {
      const seed = MemoryBlock.fromHex(CONFIG.IOTA_HOME_COMMUNITY_SEED)
      if (seed.size() < 32) {
        throw new Error('seed need to be greater than 32 Bytes')
      }
    } catch (_) {
      throw new LogError(
        'IOTA_HOME_COMMUNITY_SEED must be a valid hex string, at least 64 characters long',
      )
    }
  }
  // load crypto keys for gradido blockchain lib
  loadCryptoKeys(
    MemoryBlock.fromHex(CONFIG.GRADIDO_BLOCKCHAIN_CRYPTO_APP_SECRET),
    MemoryBlock.fromHex(CONFIG.GRADIDO_BLOCKCHAIN_SERVER_CRYPTO_KEY),
  )
  // eslint-disable-next-line no-console
  console.log(`DLT_CONNECTOR_PORT=${CONFIG.DLT_CONNECTOR_PORT}`)
  const { app } = await createServer()

  // ask backend for home community if we haven't one
  const backend = BackendClient.getInstance()
  if (!backend) {
    throw new LogError('cannot create backend client')
  }
  // wait for backend server to be ready
  await waitForServer(backend, 2500, 10)

  const communityDraft = await backend.getHomeCommunityDraft()
  KeyPairCacheManager.getInstance().setHomeCommunityUUID(communityDraft.uuid)
  const addCommunityContext = new AddCommunityContext(communityDraft)
  await addCommunityContext.run()

  // loop run all the time, check for new transaction for sending to iota
  void transmitToIota()
  app.listen(CONFIG.DLT_CONNECTOR_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running at http://localhost:${CONFIG.DLT_CONNECTOR_PORT}`)
  })

  process.on('exit', () => {
    // Add shutdown logic here.
    stopTransmitToIota()
  })
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  // eslint-disable-next-line n/no-process-exit
  process.exit(1)
})

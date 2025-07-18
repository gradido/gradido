import { Elysia } from 'elysia'
import { CONFIG } from './config'
import { loadCryptoKeys, MemoryBlock } from 'gradido-blockchain-js'
import { getLogger, configure } from 'log4js'
import { readFileSync } from 'node:fs'
import { isPortOpenRetry } from './utils/network'
import { BackendClient } from './client/BackendClient'
import { KeyPairCacheManager } from './KeyPairCacheManager'
import { communityUuidToTopicSchema } from './schemas/rpcParameter.schema'
import { parse } from 'valibot'
import { getTransaction } from './client/GradidoNode/jsonrpc.api'

async function main() {
  // configure log4js
  // TODO: replace late by loader from config-schema
  const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))
  configure(options)
  const logger = getLogger('dlt')
  // TODO: replace with schema validation
  if (CONFIG.IOTA_HOME_COMMUNITY_SEED) {
    try {
      const seed = MemoryBlock.fromHex(CONFIG.IOTA_HOME_COMMUNITY_SEED)
      if (seed.size() < 32) {
        throw new Error('seed need to be greater than 32 Bytes')
      }
    } catch (error) {
      logger.error(
        'IOTA_HOME_COMMUNITY_SEED must be a valid hex string, at least 64 characters long',
      )
      process.exit(1)
    }
  }

  // load crypto keys for gradido blockchain lib
  loadCryptoKeys(
    MemoryBlock.fromHex(CONFIG.GRADIDO_BLOCKCHAIN_CRYPTO_APP_SECRET),
    MemoryBlock.fromHex(CONFIG.GRADIDO_BLOCKCHAIN_SERVER_CRYPTO_KEY),
  )

  // ask backend for home community if we haven't one
  const backend = BackendClient.getInstance()
  if (!backend) {
    throw new Error('cannot create backend client')
  }
  // wait for backend server
  await isPortOpenRetry(CONFIG.BACKEND_SERVER_URL)
  const homeCommunity = await backend.getHomeCommunityDraft()
  KeyPairCacheManager.getInstance().setHomeCommunityUUID(homeCommunity.uuid)
  logger.info('home community topic: %s', parse(communityUuidToTopicSchema, homeCommunity.uuid))
  logger.info('gradido node server: %s', CONFIG.NODE_SERVER_URL)
  // ask gradido node if community blockchain was created
  try {
    const topic = parse(communityUuidToTopicSchema, homeCommunity.uuid)
    if (!await getTransaction(1, topic)) {
      // if not exist, create community root transaction
      await SendToIotaContext(homeCommunity)
    }
  } catch (e) {
    logger.error('error requesting gradido node: ', e)
  }
  
  const app = new Elysia()
    .get('/', () => "Hello Elysia")
    .listen(CONFIG.DLT_CONNECTOR_PORT, () => {
      logger.info(`Server is running at http://localhost:${CONFIG.DLT_CONNECTOR_PORT}`)
    })
}

main().catch((e) => {
  // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized here
  console.error(e)
  process.exit(1)
})

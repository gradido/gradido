import { Elysia } from 'elysia'
import { CONFIG } from './config'
import { loadCryptoKeys, MemoryBlock } from 'gradido-blockchain-js'
import { getLogger, configure } from 'log4js'
import { readFileSync } from 'node:fs'
import { isPortOpenRetry } from './utils/network'
import { BackendClient } from './client/backend/BackendClient'
import { KeyPairCacheManager } from './KeyPairCacheManager'
import { getTransaction } from './client/GradidoNode/api'
import { Uuidv4Hash } from './data/Uuidv4Hash'
import { SendToIotaContext } from './interactions/sendToIota/SendToIota.context'
import { keyGenerationSeedSchema } from './schemas/base.schema'
import * as v from 'valibot'

async function main() {
  // configure log4js
  // TODO: replace late by loader from config-schema
  const options = JSON.parse(readFileSync(CONFIG.LOG4JS_CONFIG, 'utf-8'))
  configure(options)
  const logger = getLogger('dlt')
  // check if valid seed for root key pair generation is present
  if (!v.safeParse(keyGenerationSeedSchema, CONFIG.IOTA_HOME_COMMUNITY_SEED).success) {
    logger.error('IOTA_HOME_COMMUNITY_SEED must be a valid hex string, at least 64 characters long')
    process.exit(1)
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
  const topic = new Uuidv4Hash(homeCommunity.uuid).getAsHexString()
  logger.info('home community topic: %s', topic)
  logger.info('gradido node server: %s', CONFIG.NODE_SERVER_URL)
  // ask gradido node if community blockchain was created
  try {
    if (!await getTransaction({ transactionNr: 1, topic })) {
      // if not exist, create community root transaction
      await SendToIotaContext(homeCommunity)
    }
  } catch (e) {
    logger.error('error requesting gradido node: ', e)
  }
  // listen for rpc request from backend (replace graphql with json rpc)
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
